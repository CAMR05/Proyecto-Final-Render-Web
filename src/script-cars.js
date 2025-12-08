import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/**
 * ------------------------------------------------------------------
 * CONFIGURACIÓN DE ESCENA
 * ------------------------------------------------------------------
 */
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()
scene.background = new THREE.Color('#1a1a1a') // Fondo asfalto oscuro

// Niebla para que los coches lejanos se desvanezcan elegantemente
scene.fog = new THREE.Fog('#1a1a1a', 10, 25)

/**
 * 🚗 TU COLECCIÓN DE COCHES
 * Añade aquí las rutas de tus modelos GLTF
 */
const carsList = [
    { name: 'McQueen', path: '/models/radiator_springs_lightning_mcqueen/scene.gltf', scale: 0.05 },
    { name: 'Mater', path: '/models/mate/scene.gltf', scale: 1.2 }, // Ejemplo
    { name: 'Sally', path: '/models/sally/scene.gltf', scale: 0.04 }, // Ejemplo
    { name: 'Doc', path: '/models/doc_hudson/scene.gltf', scale: 1 }, // Ejemplo
    { name: 'Ramone', path: '/models/ramone/scene.gltf', scale: 1 }, // Ejemplo
]

// Distancia horizontal entre cada coche
const carGap = 6 

/**
 * 📏 CÁMARA
 */
const sizes = { width: window.innerWidth, height: window.innerHeight }
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)

// Posición: Un poco lateral y elevada para verlos en perspectiva "Showroom"
camera.position.set(0, 1.5, 5) 
scene.add(camera)

/**
 * 💡 LUCES & REFLEJOS (Vital para metales)
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.0)
scene.add(ambientLight)

const dirLight = new THREE.DirectionalLight(0xffffff, 3.0)
dirLight.position.set(5, 10, 7)
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
 * 📂 LOADERS
 */
const loadingManager = new THREE.LoadingManager()
const gltfLoader = new GLTFLoader(loadingManager)
const cubeTexloader = new THREE.CubeTextureLoader(loadingManager)

// Cargamos el mapa de entorno (Skybox) para que la pintura brille
// OJO: Asegúrate de que las imágenes existan en tu carpeta public
const envMap = cubeTexloader.load(
    [
        '/sky_17_cubemap_2k/px.png', '/sky_17_cubemap_2k/nx.png',
        '/sky_17_cubemap_2k/py.png', '/sky_17_cubemap_2k/ny.png',
        '/sky_17_cubemap_2k/pz.png', '/sky_17_cubemap_2k/nz.png'
    ],
    () => { scene.environment = envMap } // Solo reflejos, no fondo visible
)

/**
 * 🏗️ CONSTRUCCIÓN DE LA FILA
 */
const galleryGroup = new THREE.Group()
scene.add(galleryGroup)

const loadedCars = [] // Array para guardar referencias y animarlos

carsList.forEach((carData, index) => {
    // Si no tienes el modelo real aún, usa el de McQueen para probar todos
    // const path = carData.path // (Usa esto cuando tengas todos)
    const path = carData.path || '/models/radiator_springs_lightning_mcqueen/scene.gltf' // Fallback para test

    gltfLoader.load(path, (gltf) => {
        const model = gltf.scene
        
        // Configuración
        model.scale.set(carData.scale, carData.scale, carData.scale)
        
        // Aplicar reflejos a todo el modelo
        model.traverse((child) => {
            if(child.isMesh) {
                child.material.envMap = envMap
                child.material.envMapIntensity = 1.5 // Más brillo para coches
            }
        })

        // --- POSICIÓN LINEAL ---
        // Los colocamos en fila sobre el eje X
        model.position.x = index * carGap
        model.position.y = -1 // Bajarlos un poco al "suelo"
        
        // Rotación inicial: De perfil (90 grados) para verlos bien al pasar
        model.rotation.y = Math.PI / 2 

        galleryGroup.add(model)
        loadedCars.push(model)
    })
})

/**
 * 🖱️ SCROLL & TOUCH (HÍBRIDO)
 */
let scrollX = 0         // Destino
let currentScroll = 0   // Actual (Lerp)
const maxScroll = (carsList.length - 1) * carGap // Límite para no pasar al infinito

// 1. DESKTOP (Rueda)
window.addEventListener('wheel', (e) => {
    // Scroll horizontal con la rueda vertical
    scrollX += e.deltaY * 0.005
    // Clamp (Límites)
    scrollX = Math.min(Math.max(scrollX, -2), maxScroll + 2)
})

// 2. MOBILE (Swipe)
let touchStartX = 0
let isDragging = false

window.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX
    isDragging = true
})

window.addEventListener('touchmove', (e) => {
    if (!isDragging) return
    const touchX = e.touches[0].clientX
    const deltaX = touchX - touchStartX
    
    // Sensibilidad táctil
    scrollX -= deltaX * 0.02
    scrollX = Math.min(Math.max(scrollX, -2), maxScroll + 2)
    
    touchStartX = touchX
})

window.addEventListener('touchend', () => { isDragging = false })

/**
 * 🎬 ANIMACIÓN & EFECTO SUSPENSIÓN
 */
const tick = () => {
    
    // 1. Mover la cámara suavemente hacia la posición del scroll
    currentScroll += (scrollX - currentScroll) * 0.05
    camera.position.x = currentScroll

    // 2. Calcular Velocidad (Inercia)
    const velocity = scrollX - currentScroll

    // 3. Animar cada coche
    loadedCars.forEach((car) => {
        // A) Rotación leve "Showroom"
        // El coche gira muy despacito para mostrar sus reflejos
        car.rotation.y = (Math.PI / 2) + (Math.sin(Date.now() * 0.001) * 0.05)

        // B) EFECTO SUSPENSIÓN (Pitch)
        // Al acelerar (scroll), el coche se "agacha" o levanta el morro (eje Z o X según modelo)
        // velocity * 0.2 controla la fuerza del cabeceo
        car.rotation.z = -velocity * 0.15 
        
        // C) EFECTO VELOCIDAD (Opcional)
        // Se inclina un poco hacia atrás como si el viento le pegara
        // car.rotation.x = -velocity * 0.05
    })

    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()

/**
 * 🔙 BOTÓN VOLVER
 */
// Asegúrate de tener <button id="back-btn" ...> en tu HTML
const backBtn = document.getElementById('back-btn')
if(backBtn) {
    backBtn.addEventListener('click', () => {
        window.history.back() // O window.location.href = 'index.html'
    })
}