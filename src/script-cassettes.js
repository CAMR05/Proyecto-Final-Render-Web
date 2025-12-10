import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import gsap from 'gsap'

/**
 * CONFIGURACIÓN ESCENA
 */
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()
scene.background = new THREE.Color('#111111') // Gris muy oscuro
scene.fog = new THREE.Fog('#111111', 10, 30)

// Referencias UI (Con validación básica)
const detailPanel = document.getElementById('detail-panel')
const closeBtn = document.getElementById('close-detail')
const uiTitle = document.getElementById('detail-title')
const uiDesc = document.getElementById('detail-desc')
const uiLabel1 = document.getElementById('label-1')
const uiStat1 = document.getElementById('stat-1')
const uiLabel2 = document.getElementById('label-2')
const uiStat2 = document.getElementById('stat-2')

let isViewingDetail = false 
let selectedIndex = null 

/**
 * 📼 DATOS DE CASSETTES
 * ¡IMPORTANTE! Verifica que estas rutas existan en tu carpeta 'public'
 */
const itemsList = [
    { 
        name: 'Awesome Mix Vol. 1', 
        // Si no tienes este modelo específico, usa uno genérico para probar:
        // path: '/models/cassette_case/scene.gltf', 
        path: '/models/cassettes/cassette_tape_awesome/scene.gltf', 
        scale: 6, 
        rotationOffset: 0,
        bio: "La banda sonora de una generación galáctica. Contiene clásicos de los 70s y 80s.",
        stats: { label1: 'Artista', val1: 'Varios', label2: 'Género', val2: 'Pop/Rock' }
    },
    { 
        name: 'MF DOOM', 
        path: '/models/cassettes/cassette_tape_doom/scene.gltf', 
        scale: 0.5, 
        rotationOffset: 0,
        bio: "El enigmático maestro del hip-hop underground.",
        stats: { label1: 'Artista', val1: 'MF DOOM', label2: 'Género', val2: 'Hip-Hop' }
    },
    { 
        name: 'Edward Van Halen', 
        path: '/models/cassettes/compact_cassette_eddie/scene.gltf', 
        scale: 6, 
        rotationOffset: 0,
        bio: "El virtuoso de la guitarra que revolucionó el rock.",
        stats: { label1: 'Artista', val1: 'Eddie Van Halen', label2: 'Género', val2: 'Rock' }
    },
]

const gap = 5 

/**
 * CÁMARA & LUCES
 */
const sizes = { width: window.innerWidth, height: window.innerHeight }
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.5, 100)
camera.position.set(0, 0, 5) 
scene.add(camera)

// Luz más fuerte para ver objetos oscuros
const ambientLight = new THREE.AmbientLight(0xffffff, 2.5)
scene.add(ambientLight)
const dirLight = new THREE.DirectionalLight(0xffffff, 3.0)
dirLight.position.set(5, 5, 7)
scene.add(dirLight)

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
})

/**
 * LOADERS
 */
const loadingManager = new THREE.LoadingManager()
const gltfLoader = new GLTFLoader(loadingManager)
const cubeTexloader = new THREE.CubeTextureLoader(loadingManager)

const envMap = cubeTexloader.load(
    ['/sky_17_cubemap_2k/px.png', '/sky_17_cubemap_2k/nx.png', '/sky_17_cubemap_2k/py.png', '/sky_17_cubemap_2k/ny.png', '/sky_17_cubemap_2k/pz.png', '/sky_17_cubemap_2k/nz.png'],
    () => { scene.environment = envMap }
)

/**
 * CONSTRUCCIÓN
 */
const galleryGroup = new THREE.Group()
scene.add(galleryGroup)
const loadedItems = [] 

itemsList.forEach((data, index) => {
    gltfLoader.load(
        data.path, 
        (gltf) => {
            const model = gltf.scene
            
            model.userData = { 
                id: index,
                ...data, 
                baseY: 0 
            }

            model.scale.set(data.scale, data.scale, data.scale)
            model.traverse((c) => { if(c.isMesh) { c.material.envMap = envMap; c.material.envMapIntensity = 1.0 } })

            const baseX = index * gap
            const xFix = data.offset ? data.offset.x : 0
            const yFix = data.offset ? data.offset.y : 0
            const zFix = data.offset ? data.offset.z : 0

            model.position.set(baseX + xFix, yFix, zFix)
            model.rotation.y = (Math.PI / 2) + (data.rotationOffset || 0)

            galleryGroup.add(model)
            loadedItems.push(model)
        },
        undefined,
        (error) => {
            console.error("❌ Error cargando modelo:", data.name, error);
            // Esto te dirá en la consola (F12) si la ruta está mal
        }
    )
})

/**
 * INTERACCIÓN
 */
let scrollX = 0 
let currentScroll = 0
const maxScroll = (itemsList.length - 1) * gap 

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// Desktop
window.addEventListener('wheel', (e) => {
    if (isViewingDetail) return; // Permitir scroll nativo en ficha
    e.preventDefault(); 
    scrollX += e.deltaY * 0.005
    scrollX = Math.min(Math.max(scrollX, -2), maxScroll + 2)
}, { passive: false })

// Mobile
let touchStartX = 0
let isDragging = false
window.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX
    if (!isViewingDetail) isDragging = true;
    mouse.x = (e.touches[0].clientX / sizes.width) * 2 - 1
    mouse.y = -(e.touches[0].clientY / sizes.height) * 2 + 1
}, { passive: false })

window.addEventListener('touchmove', (e) => {
    if (isViewingDetail) return;
    e.preventDefault(); 
    if (!isDragging) return
    const deltaX = e.touches[0].clientX - touchStartX
    scrollX -= deltaX * 0.02
    scrollX = Math.min(Math.max(scrollX, -2), maxScroll + 2)
    touchStartX = e.touches[0].clientX
}, { passive: false })

window.addEventListener('touchend', () => { isDragging = false })

// Clic
window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / sizes.width) * 2 - 1
    mouse.y = -(e.clientY / sizes.height) * 2 + 1
})

window.addEventListener('click', () => {
    if (isViewingDetail) return
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(galleryGroup.children, true)

    if (intersects.length > 0) {
        const objectHit = intersects[0].object
        // Búsqueda segura en array
        const itemFound = loadedItems.find(root => {
            let belongs = false;
            root.traverse((child) => { if (child === objectHit) belongs = true; });
            return belongs;
        });
        if (itemFound) openDetail(itemFound);
    }
})

function openDetail(item) {
    if (!item.position) return;
    isViewingDetail = true
    selectedIndex = item.userData.id

    // Validar que los elementos existen antes de asignar
    if(uiTitle) uiTitle.innerText = item.userData.name
    if(uiDesc) uiDesc.innerText = item.userData.bio
    if(uiLabel1) uiLabel1.innerText = item.userData.stats.label1 + ":"
    if(uiStat1) uiStat1.innerText = item.userData.stats.val1
    if(uiLabel2) uiLabel2.innerText = item.userData.stats.label2 + ":"
    if(uiStat2) uiStat2.innerText = item.userData.stats.val2

    if(detailPanel) {
        detailPanel.style.display = 'block'
        detailPanel.scrollTop = 0; 
        setTimeout(() => {
            detailPanel.style.opacity = '1'
            detailPanel.style.pointerEvents = 'all'
        }, 10)
    }

    const isMobile = window.innerWidth < 768
    const targetZ = isMobile ? 4 : 2.5 
    const targetXOffset = isMobile ? 0 : 1.5
    const targetX = item.position.x + targetXOffset

    gsap.to(camera.position, { duration: 1.5, x: targetX, y: 0, z: targetZ, ease: 'power2.inOut' })
}

if(closeBtn) {
    closeBtn.addEventListener('click', () => {
        isViewingDetail = false
        selectedIndex = null
        if(detailPanel) {
            detailPanel.style.opacity = '0'
            detailPanel.style.pointerEvents = 'none'
            setTimeout(() => { if(!isViewingDetail) detailPanel.style.display = 'none' }, 500)
        }
        gsap.to(camera.position, { duration: 1.0, x: currentScroll, y: 0, z: 5, ease: 'power2.inOut' })
    })
}

/**
 * LOOP
 */
const tick = () => {
    const time = Date.now() * 0.001;

    if (!isViewingDetail) {
        currentScroll += (scrollX - currentScroll) * 0.05
        camera.position.x = currentScroll
        
        loadedItems.forEach((item, i) => {
            // Animación FLOTAR
            item.position.y = item.userData.baseY + Math.sin(time + i) * 0.1
            item.rotation.y = (Math.PI / 2) + Math.cos(time * 0.5 + i) * 0.1
        })
    } else {
        if (selectedIndex !== null) {
            // Buscamos por ID en lugar de índice directo para evitar errores de orden
            const item = loadedItems.find(c => c.userData.id === selectedIndex);
            if (item) item.rotation.y += 0.005 
        }
    }
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}
tick()

const backBtn = document.getElementById('back-btn')
if(backBtn) backBtn.addEventListener('click', () => window.location.href = 'index.html')