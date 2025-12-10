import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import gsap from 'gsap'

/**
 * CONFIGURACIÓN ESCENA
 */
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()
scene.background = new THREE.Color('#111111') // Fondo más oscuro para música
scene.fog = new THREE.Fog('#111111', 10, 30)

// Referencias UI
const detailPanel = document.getElementById('detail-panel')
const closeBtn = document.getElementById('close-detail')
const uiTitle = document.getElementById('detail-title')
const uiDesc = document.getElementById('detail-desc')
// Stats
const uiLabel1 = document.getElementById('label-1')
const uiStat1 = document.getElementById('stat-1')
const uiLabel2 = document.getElementById('label-2')
const uiStat2 = document.getElementById('stat-2')

let isViewingDetail = false 
let selectedIndex = null 

/**
 *  DATOS DE CASSETTES
 */
const itemsList = [
    { 
        name: 'Awesome Mix Vol. 1', 
        path: '/models/cassettes/cassette_tape_awesome/scene.gltf', // Tu modelo de cassette
        scale: 1, 
        rotationOffset: 0,
        bio: "La banda sonora de una generación galáctica. Contiene clásicos de los 70s y 80s.",
        stats: { label1: 'Artista', val1: 'Varios', label2: 'Género', val2: 'Pop/Rock' }
    },
    { 
        name: 'MF DOOM', 
        path: '/models/cassette_tape_doom/scene.gltf', 
        scale: 1, 
        rotationOffset: 0,
        bio: "El enigmático maestro del hip-hop underground. Letras complejas y beats innovadores.",
        stats: { label1: 'Artista', val1: 'MF DOOM', label2: 'Género', val2: 'Hip-Hop' }
    },
    { 
        name: 'Edward Van Halen', 
        path: '/models/compact_cassette_eddie/scene.gltf', 
        scale: 1, 
        rotationOffset: 0,
        bio: "El virtuoso de la guitarra que revolucionó el rock. Técnicas innovadoras y solos inolvidables.",
        stats: { label1: 'Artista', val1: 'Eddie Van Halen', label2: 'Género', val2: 'Rock' }
    },
]

const gap = 5 

/**
 * CÁMARA & LUCES
 */
const sizes = { width: window.innerWidth, height: window.innerHeight }
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.5, 100)
camera.position.set(0, 0, 5) // Cámara frente a los objetos (Z)
scene.add(camera)

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
scene.add(ambientLight)
const dirLight = new THREE.DirectionalLight(0xffffff, 2.0)
dirLight.position.set(5, 5, 7)
scene.add(dirLight)

// Luz puntual extra para dar brillo al plástico del cassette
const pointLight = new THREE.PointLight(0x00ffff, 1, 10)
pointLight.position.set(0, 2, 2)
scene.add(pointLight)

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

// Usamos el mismo skybox para reflejos del plástico
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
    gltfLoader.load(data.path, (gltf) => {
        const model = gltf.scene
        
        model.userData = { 
            id: index,
            ...data, // Copiamos todos los datos (name, bio, stats)
            baseY: 0 // Guardamos la Y base para la animación de flotación
        }

        model.scale.set(data.scale, data.scale, data.scale)
        model.traverse((c) => { if(c.isMesh) { c.material.envMap = envMap; c.material.envMapIntensity = 1.0 } })

        // Posición en fila
        const baseX = index * gap
        const xFix = data.offset ? data.offset.x : 0
        const yFix = data.offset ? data.offset.y : 0
        const zFix = data.offset ? data.offset.z : 0

        model.position.set(baseX + xFix, yFix, zFix)
        
        // Rotación inicial (Si quieres que el cassette esté de pie o acostado)
        model.rotation.y = (Math.PI / 2) + (data.rotationOffset || 0)
        // model.rotation.x = Math.PI / 2 // Descomenta si el cassette viene acostado

        galleryGroup.add(model)
        loadedItems.push(model)
    })
})

/**
 * INTERACCIÓN
 */
let scrollX = 0 
let currentScroll = 0
const maxScroll = (itemsList.length - 1) * gap 

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// Scroll Desktop
window.addEventListener('wheel', (e) => {
    e.preventDefault(); 
    if (isViewingDetail) return 
    scrollX += e.deltaY * 0.005
    scrollX = Math.min(Math.max(scrollX, -2), maxScroll + 2)
}, { passive: false })

// Touch
let touchStartX = 0
let isDragging = false
window.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX
    isDragging = true
    mouse.x = (e.touches[0].clientX / sizes.width) * 2 - 1
    mouse.y = -(e.touches[0].clientY / sizes.height) * 2 + 1
}, { passive: false })

window.addEventListener('touchmove', (e) => {
    e.preventDefault(); 
    if (isViewingDetail || !isDragging) return
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

    // UI DINÁMICA
    uiTitle.innerText = item.userData.name
    uiDesc.innerText = item.userData.bio
    
    // Asignar etiquetas dinámicas (Ej: "Artista", "Género")
    uiLabel1.innerText = item.userData.stats.label1 + ":"
    uiStat1.innerText = item.userData.stats.val1
    uiLabel2.innerText = item.userData.stats.label2 + ":"
    uiStat2.innerText = item.userData.stats.val2

    detailPanel.style.display = 'block'
    detailPanel.scrollTop = 0; 
    setTimeout(() => {
        detailPanel.style.opacity = '1'
        detailPanel.style.pointerEvents = 'all'
    }, 10)

    const isMobile = window.innerWidth < 768
    const targetZ = isMobile ? 4 : 2.5 
    const targetX = item.position.x + (isMobile ? 0 : 1.5)

    gsap.to(camera.position, { duration: 1.5, x: targetX, y: 0, z: targetZ, ease: 'power2.inOut' })
}

closeBtn.addEventListener('click', () => {
    isViewingDetail = false
    selectedIndex = null
    detailPanel.style.opacity = '0'
    detailPanel.style.pointerEvents = 'none'
    setTimeout(() => { if(!isViewingDetail) detailPanel.style.display = 'none' }, 500)
    
    gsap.to(camera.position, { duration: 1.0, x: currentScroll, y: 0, z: 5, ease: 'power2.inOut' })
})

/**
 * LOOP
 */
const tick = () => {
    const time = Date.now() * 0.001;

    if (!isViewingDetail) {
        currentScroll += (scrollX - currentScroll) * 0.05
        camera.position.x = currentScroll
        
        // ANIMACIÓN FLOTE
        loadedItems.forEach((item, i) => {
            // Flotación suave en Y (Seno)
            // Usamos 'i' para desfasar la ola y que no floten todos igual
            item.position.y = item.userData.baseY + Math.sin(time + i) * 0.1
            
            // Rotación leve
            item.rotation.y = (Math.PI / 2) + Math.cos(time * 0.5 + i) * 0.1
        })
    } else {
        // En detalle, gira lento
        if (selectedIndex !== null) {
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