import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import gsap from 'gsap'

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * CONFIGURACIÓN DEL CARRUSEL
 */
const carouselRadius = 6 // Radio del círculo
const scaleMultiplier = 1.5 // Cuánto crece el objeto activo (1.5 = 50% más grande)
const carouselGroup = new THREE.Group()
scene.add(carouselGroup)

// Lista de modelos con sus escalas base individuales
const modelsList = [
    { path: '/models/comic/scene.gltf', scale: 1 },
    { path: '/models/radiator_springs_lightning_mcqueen/scene.gltf', scale: 0.05 }, 
    { path: '/models/cassette_case/scene.gltf', scale: 1 }, 
    // Puedes repetir para llenar más el círculo si quieres
]

/**
 * Luces
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.4)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8)
directionalLight.position.set(5, 5, 5)
directionalLight.castShadow = true
scene.add(directionalLight)

/**
 * Tamaños
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Cámara
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
// Posición: En el centro X, un poco arriba en Y, y hacia atrás en Z para ver el carrusel completo
camera.position.set(0, 1.5, 11) 
scene.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true // Fondo transparente (opcional)
})
renderer.shadowMap.enabled = true
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Loaders & Environment Map
 */
const loadingManager = new THREE.LoadingManager()
const gltfLoader = new GLTFLoader(loadingManager)
const cubeTexloader = new THREE.CubeTextureLoader(loadingManager)

// Carga del mapa de entorno (para que los metales brillen)
const envMap = cubeTexloader.load([
    '/sky_17_cubemap_2k/nx.png', '/sky_17_cubemap_2k/px.png',
    '/sky_17_cubemap_2k/py.png', '/sky_17_cubemap_2k/ny.png',
    '/sky_17_cubemap_2k/nz.png', '/sky_17_cubemap_2k/pz.png',
])
scene.background = envMap // O puedes quitar esto si quieres fondo de color plano
scene.environment = envMap

/**
 * 🌀 LÓGICA DE CARGA Y POSICIONAMIENTO RADIAL
 */
const angleIncrement = (Math.PI * 2) / modelsList.length // 360 grados / número de modelos

modelsList.forEach((modelData, index) => {
    gltfLoader.load(modelData.path, (gltf) => {
        const model = gltf.scene

        // 1. Guardamos la escala base en la memoria del objeto
        // Esto es crucial para saber a qué tamaño volver cuando deje de ser "activo"
        model.userData.baseScale = modelData.scale

        // 2. Aplicamos escala inicial
        model.scale.set(modelData.scale, modelData.scale, modelData.scale)

        // 3. Materiales (Environment Map)
        model.traverse((child) => {
            if (child.isMesh) {
                child.material.envMap = envMap
                child.material.envMapIntensity = 1.0
            }
        })

        // 4. Matemáticas Circulares
        const angle = index * angleIncrement
        
        // Coordenadas Polares (X, Z)
        const x = Math.cos(angle) * carouselRadius
        const z = Math.sin(angle) * carouselRadius

        model.position.set(x, 0, z)

        // 5. Orientación: Hacemos que miren hacia afuera
        // Rotamos -angle para contrarrestar la posición y -PI/2 para alinear el frente
        model.rotation.y = -angle - Math.PI / 2

        // Añadir al grupo
        carouselGroup.add(model)
    })
})

/**
 * 🖱️ EVENTO SCROLL (GSAP)
 */
let scrollY = 0

window.addEventListener('wheel', (event) => {
    // Sensibilidad del scroll
    scrollY += event.deltaY * 0.002

    // Rotamos todo el grupo
    gsap.to(carouselGroup.rotation, {
        duration: 1.5,
        ease: 'power2.out', // Frenado suave
        y: scrollY
    })
})

/**
 * 🎬 ANIMATE LOOP
 */
let currentActiveObject = null // Rastreador del objeto seleccionado

const tick = () => {
    
    // --- LÓGICA DE DETECCIÓN DE ACTIVO ---
    if (carouselGroup.children.length > 0) {
        let closestObject = null
        let minDistance = Infinity

        // 1. Buscar quién está más cerca de la cámara
        carouselGroup.children.forEach((mesh) => {
            // Obtener posición absoluta en el mundo
            const worldPosition = new THREE.Vector3()
            mesh.getWorldPosition(worldPosition)

            const distance = camera.position.distanceTo(worldPosition)

            if (distance < minDistance) {
                minDistance = distance
                closestObject = mesh
            }
        })

        // 2. Si cambió el protagonista, animamos escalas
        if (closestObject && closestObject !== currentActiveObject) {
            
            // A) Encoger el anterior (si existe)
            if (currentActiveObject) {
                const base = currentActiveObject.userData.baseScale
                gsap.to(currentActiveObject.scale, {
                    duration: 0.5,
                    x: base, y: base, z: base,
                    ease: 'power1.out'
                })
            }

            // B) Agrandar el nuevo
            const base = closestObject.userData.baseScale
            const activeScale = base * scaleMultiplier
            
            gsap.to(closestObject.scale, {
                duration: 0.6,
                x: activeScale, y: activeScale, z: activeScale,
                ease: 'back.out(2)' // Efecto rebote
            })

            // Actualizar referencia
            currentActiveObject = closestObject
        }
    }

    // Render
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()