import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import gsap from 'gsap'

/**
 * 1. BOTÓN VOLVER
 */
const backBtn = document.getElementById('back-btn')
if(backBtn) {
    backBtn.addEventListener('click', () => {
        window.location.href = 'index.html'
    })
}

/**
 * 2. CONFIGURACIÓN ESCENA
 */
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()
scene.background = new THREE.Color('#eeeeee') 
scene.fog = new THREE.Fog('#eeeeee', 8, 25)

// REFERENCIAS UI
const detailPanel = document.getElementById('comic-detail-panel')
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
 * DATOS DE COMICS 
 */
const itemsList = [
    { 
        name: 'Amazing Fantasy #15', 
        path: '/models/comicbooks/comic/scene.gltf', 
        scale: 1, 
        bio: "El inicio de una leyenda. Peter Parker descubre que un gran poder conlleva una gran responsabilidad.",
        stats: { label1: 'Editorial', val1: 'Marvel', label2: 'Año', val2: '1963' }
    },
    { 
        name: 'Invincible', 
        path: '/models/comicbooks/comic_book_invincible_1/scene.gltf', 
        scale: 1, 
        bio: "Mark Grayson, hijo de un superhéroe alienígena, descubre sus propios poderes y enfrenta amenazas cósmicas.",
        stats: { label1: 'Editorial', val1: 'Image Comics', label2: 'Año', val2: '2003' }
    },
    {
        name: 'Akira Volume. 4',
        path: '/models/comicbooks/akira_vol._4_photogrammetry/scene.gltf',
        scale: 0.15, 
        bio: "La distopía cyberpunk en su máxima expresión. Kaneda y Tetsuo enfrentan su destino en Neo-Tokio.",
        stats: { label1: 'Editorial', val1: 'Kodansha', label2: 'Año', val2: '1984' }
    },
    {
        name: 'Spawn',
        path: '/models/comicbooks/comic_book_spawn_1/scene.gltf',
        scale: 1, 
        bio: "Al Simmons regresa del infierno como Spawn, enfrentando su nueva realidad y buscando venganza.",
        stats: { label1: 'Editorial', val1: 'Image Comics', label2: 'Año', val2: '1992' }
    },
    {
        name: 'Deadpool & Wolverine',
        path: '/models/comicbooks/deadpool/scene.gltf',
        scale: 2.5, 
        bio: "La caótica dupla de Deadpool y Wolverine se embarca en una aventura llena de acción y humor irreverente.",
        stats: { label1: 'Editorial', val1: 'Marvel', label2: 'Año', val2: '1991' }
    },
    {
        name: 'Swamp Thing',
        path: '/models/comicbooks/swamp_thing_comic/scene.gltf',
        scale: 1.5, 
        bio: "La criatura del pantano lucha por proteger la naturaleza y descubrir su propia humanidad.",
        stats: { label1: 'Editorial', val1: 'DC Comics', label2: 'Año', val2: '1971' }
    },
    {
        name: 'The Walking Dead #1',
        path: '/models/comicbooks/the_walking_dead_comic/scene.gltf',
        scale: 0.002, 
        bio: "El inicio de la saga apocalíptica. Rick Grimes despierta en un mundo dominado por los muertos vivientes.",
        stats: { label1: 'Editorial', val1: 'Image Comics', label2: 'Año', val2: '2003' }
    }
]

const gap = 3.5 

/**
 * 3. CÁMARA & LUCES
 */
const sizes = { width: window.innerWidth, height: window.innerHeight }

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.5, 200)
camera.position.set(0, 0, 6) 
scene.add(camera)

const ambientLight = new THREE.AmbientLight(0xffffff, 2.5) 
scene.add(ambientLight)
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
dirLight.position.set(2, 5, 5)
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
 * 4. LOADERS
 */

const loadingManager = new THREE.LoadingManager()
const gltfLoader = new GLTFLoader(loadingManager)
const cubeTexloader = new THREE.CubeTextureLoader(loadingManager)

const envMap = cubeTexloader.load(
    [
        '/Comic-Cube-Map/px.png', '/Comic-Cube-Map/nx.png',
        '/Comic-Cube-Map/py.png', '/Comic-Cube-Map/ny.png',
        '/Comic-Cube-Map/pz.png', '/Comic-Cube-Map/nz.png'
    ],
    () => {
        scene.environment = envMap;
        scene.background = envMap;
    },
    undefined,
    (err) => console.warn("⚠️ No se cargó la textura de fondo. Verifica la carpeta /Comic-Cube-Map/")
)


/**
 * 5. CONSTRUCCIÓN
 */
const galleryGroup = new THREE.Group()
scene.add(galleryGroup)
const loadedItems = [] 

itemsList.forEach((data, index) => {
    gltfLoader.load(
        data.path, 
        (gltf) => {
            const model = gltf.scene
            
            // Offsets de posición manual (si hubiera)
            const xFix = data.offset ? data.offset.x : 0
            const yFix = data.offset ? data.offset.y : 0
            const zFix = data.offset ? data.offset.z : 0
            
            // Rotaciones manuales
            // Si no definimos fixRot en data, usamos 0 por defecto
            const rotX = data.fixRot ? data.fixRot.x : 0
            const rotY = data.fixRot ? data.fixRot.y : 0
            const rotZ = data.fixRot ? data.fixRot.z : 0

            // Guardamos datos incluyendo la rotación base para usarla en la animación
            model.userData = { 
                id: index, 
                ...data,
                baseRotation: { x: rotX, y: rotY, z: rotZ }
            }
            
            model.scale.set(data.scale, data.scale, data.scale)

            // Posición Base
            const baseX = index * gap
            model.position.set(baseX + xFix, 0 + yFix, 0 + zFix)
            
            // APLICAMOS LA ROTACIÓN CORREGIDA INICIAL
            model.rotation.set(rotX, rotY, rotZ)

            galleryGroup.add(model)
            loadedItems.push(model)
        },
        undefined,
        (err) => console.error("Error cargando comic:", data.name, err)
    )
})

/**
 * 6. INTERACCIÓN
 */
let scrollX = 0 
let currentScroll = 0
const maxScroll = (itemsList.length - 1) * gap 

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// Scroll Desktop
window.addEventListener('wheel', (e) => {
    if (isViewingDetail) return;
    e.preventDefault(); 
    scrollX += e.deltaY * 0.005
    scrollX = Math.min(Math.max(scrollX, -2), maxScroll + 2)
}, { passive: false })

// Scroll Mobile
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
        // Búsqueda recursiva segura
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
    
    // UI
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

    // Cámara Comics (Zoom In)
    const isMobile = window.innerWidth < 768
    const targetZ = isMobile ? 4 : 3 
    const targetX = item.position.x + (isMobile ? 0 : 1.5)

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
        // Regresar la cámara
        gsap.to(camera.position, { duration: 1.0, x: currentScroll, y: 0, z: 6, ease: 'power2.inOut' })
    })
}

/**
 * 7. LOOP DE ANIMACIÓN
 */
const tick = () => {
    const time = Date.now() * 0.001;

    if (!isViewingDetail) {
        currentScroll += (scrollX - currentScroll) * 0.05
        camera.position.x = currentScroll
        
        const velocity = scrollX - currentScroll

        loadedItems.forEach((item) => {
            const baseRotX = item.userData.baseRotation.x
            const baseRotY = item.userData.baseRotation.y
            const baseRotZ = item.userData.baseRotation.z

            // 1. Inclinación al scrollear (pasar hojas)
            item.rotation.z = baseRotZ - velocity * 0.2 
            
            // 2. Vaivén suave en Y
            item.rotation.y = baseRotY + Math.sin(time * 0.5) * 0.1
            
            // 3. Mantenemos X fijo en su corrección base
            item.rotation.x = baseRotX 
        })
    } else {
        if (selectedIndex !== null) {
            const item = loadedItems.find(c => c.userData.id === selectedIndex);
            if (item) {
                const baseRotY = item.userData.baseRotation.y
                const baseRotZ = item.userData.baseRotation.z


                item.rotation.z = baseRotZ 
                item.rotation.y = baseRotY + Math.sin(time) * 0.05 
            }
        }
    }
    window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / sizes.width) * 2 - 1
    mouse.y = -(e.clientY / sizes.height) * 2 + 1

    // Verificar si estamos sobre un objeto
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(galleryGroup.children, true)

    if (intersects.length > 0 && !isViewingDetail) {
        canvas.style.cursor = 'pointer' // Manita
    } else {
        canvas.style.cursor = 'default' // Flecha normal
    }
})
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}
tick()