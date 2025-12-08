import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
// Nota: Eliminamos FontLoader y TextGeometry porque ya no los usaremos
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'

/**
 * 1. CONFIGURACIÓN BÁSICA
 */
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

scene.background = new THREE.Color('#333333')
scene.fog = new THREE.Fog('#333333', 100, 500)

let isExperienceActive = false 

/**
 * 2. CÁMARA & CONTROLES
 */
const sizes = { width: window.innerWidth, height: window.innerHeight }
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 1, 2000)
camera.position.set(0, 150, 150) 
camera.rotation.x = -Math.PI / 4 
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enabled = true 

/**
 * 3. RENDERER
 */
const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    antialias: true,
    alpha: false 
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
})

/**
 * 4. ILUMINACIÓN
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5)
directionalLight.position.set(100, 200, 100)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(2048, 2048)
directionalLight.shadow.camera.top = 200
directionalLight.shadow.camera.bottom = -200
directionalLight.shadow.camera.left = -200
directionalLight.shadow.camera.right = 200
directionalLight.shadow.normalBias = 0.05
scene.add(directionalLight)

/**
 * 5. CARGA DE RECURSOS
 */
const loadingManager = new THREE.LoadingManager()
const gltfLoader = new GLTFLoader(loadingManager)
const cubeTexloader = new THREE.CubeTextureLoader(loadingManager)

const envMap = cubeTexloader.load(
    [
        '/sky_17_cubemap_2k/px.png', '/sky_17_cubemap_2k/nx.png',
        '/sky_17_cubemap_2k/py.png', '/sky_17_cubemap_2k/ny.png',
        '/sky_17_cubemap_2k/pz.png', '/sky_17_cubemap_2k/nz.png'
    ],
    () => {
        scene.background = envMap
        scene.environment = envMap
    }
)

/**
 * 6. ESCENARIO Y CARRUSEL
 */
// Escenario
gltfLoader.load(
    '/models/mountain_and_river_scroll/scene.gltf', 
    (gltf) => {
        const stage = gltf.scene
        stage.scale.set(5, 5, 5) 
        stage.position.set(0, -20, 0)
        scene.add(stage)
    }
)

// Carrusel
const carouselGroup = new THREE.Group()
scene.add(carouselGroup)

const carouselRadius = 5 
const scaleMultiplier = 1.5 
const clickables = [] 
const storedTextMeshes = []

const modelsList = [
    { 
        path: '/models/comic/scene.gltf', 
        scale: 0.5, 
        textPath: '/models/texto-1.gltf', 
        textScale: 1, 
        link: '/comics.html' 
    },
    { 
        path: '/models/radiator_springs_lightning_mcqueen/scene.gltf', 
        scale: 0.5, 
        textPath: '/models/texto-3.gltf',
        textScale: 1,
        link: '/cars.html' 
    },
    { 
        path: '/models/cassette_case/scene.gltf', 
        scale: 1.5, 
        textPath: '/models/texto-2.gltf',
        textScale: 1,
        link: '/cassettes.html' 
    }
]

const loadCarousel = () => {
    const angleIncrement = (Math.PI * 2) / modelsList.length 

    modelsList.forEach((modelData, index) => {
        
        const angle = index * angleIncrement
        const x = Math.cos(angle) * carouselRadius
        const z = Math.sin(angle) * carouselRadius

        const itemPivot = new THREE.Group()
        itemPivot.position.set(x, 0, z)
        itemPivot.rotation.y = -angle - Math.PI / 2
        carouselGroup.add(itemPivot)

        // --- CARGA DEL MODELO PRINCIPAL ---
        gltfLoader.load(modelData.path, (gltf) => {
            const model = gltf.scene
            model.userData.baseScale = modelData.scale
            model.userData.link = modelData.link
            // 🔥 FIX 1: Etiquetamos al modelo principal para identificarlo luego
            model.userData.isMainModel = true 
            model.scale.set(modelData.scale, modelData.scale, modelData.scale)
            
            model.traverse((c) => { 
                if(c.isMesh) {
                    c.material.envMap = envMap
                    c.castShadow = true
                }
            })
            model.position.y = -1 
            itemPivot.add(model)
            clickables.push(model)
        })

        // --- CARGA DEL MODELO DE TEXTO ---
        if (modelData.textPath) {
            gltfLoader.load(modelData.textPath, (gltf) => {
                const textModel = gltf.scene
                const tScale = modelData.textScale || 1
                textModel.scale.set(tScale, tScale, tScale)

                // 🔥 FIX 2: Evitar que el texto desaparezca (DoubleSide)
                textModel.traverse((child) => {
                    if(child.isMesh) {
                        // Esto fuerza a que se rendericen ambas caras del material
                        child.material.side = THREE.DoubleSide;
                    }
                })

                textModel.position.y = 2.0 
                textModel.userData.initialRotation = angle + Math.PI / 2
                
                itemPivot.add(textModel)
                storedTextMeshes.push(textModel)
            })
        }
    })
}

loadCarousel()

/**
 * 7. ANIMACIÓN DE ENTRADA
 */
const startButton = document.getElementById('start-btn')

if (startButton) {
    startButton.addEventListener('click', () => {
        controls.enabled = false 
        startButton.style.opacity = '0'
        setTimeout(() => startButton.style.display = 'none', 500)

        const targetPos = new THREE.Vector3(0, 2, 12) 

        const tl = gsap.timeline({
            onComplete: () => { isExperienceActive = true }
        })

        tl.to(camera.position, { duration: 4.0, x: targetPos.x, y: targetPos.y, z: targetPos.z, ease: "power2.inOut" }, 0)
        tl.to(camera.rotation, { duration: 4.0, x: 0, y: 0, z: 0, ease: "power2.inOut" }, 0)
    })
}

/**
 * 8. INTERACCIÓN
 */
let scrollY = 0
window.addEventListener('wheel', (event) => {
    if (!isExperienceActive) return 
    scrollY += event.deltaY * 0.002
    gsap.to(carouselGroup.rotation, { duration: 1.5, ease: 'power2.out', y: scrollY })
})

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
let currentIntersect = null

window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / sizes.width) * 2 - 1
    mouse.y = -(e.clientY / sizes.height) * 2 + 1
})

window.addEventListener('click', () => {
    if (!isExperienceActive) return 
    if (currentIntersect) {
        let target = currentIntersect.object
        while(target) {
            if (target.userData.link) {
                gsap.to(camera.position, {
                    duration: 1.0, z: camera.position.z - 4, ease: 'power2.in',
                    onComplete: () => window.location.href = target.userData.link
                })
                break
            }
            target = target.parent
        }
    }
})

/**
 * 9. LOOP PRINCIPAL
 */
let currentActivePivot = null 

const tick = () => {
    if(controls.enabled) controls.update()

    if (isExperienceActive) {
        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(clickables, true)
        
        if (intersects.length > 0) {
            currentIntersect = intersects[0]
            canvas.style.cursor = 'pointer'
        } else {
            currentIntersect = null
            canvas.style.cursor = 'default'
        }

        // Rotación de Textos (Contra-rotación)
        storedTextMeshes.forEach(t => t.rotation.y = -carouselGroup.rotation.y + t.userData.initialRotation)

        if (carouselGroup.children.length > 0) {
            let closestPivot = null
            let minDistance = Infinity
            carouselGroup.children.forEach((pivot) => {
                const worldPos = new THREE.Vector3()
                pivot.getWorldPosition(worldPos)
                const dist = camera.position.distanceTo(worldPos)
                if (dist < minDistance) { minDistance = dist; closestPivot = pivot }
                
                // 🔥 FIX 1 (Continuación): Rotación pasiva robusta
                if (pivot !== currentActivePivot) {
                    // Buscamos el hijo que tenga la etiqueta 'isMainModel'
                    const mainModel = pivot.children.find(c => c.userData.isMainModel === true);
                    // Si lo encontramos, lo rotamos
                    if (mainModel) mainModel.rotation.y += 0.01; 
                }
            })

            if (closestPivot && closestPivot !== currentActivePivot) {
                // Reset anterior
                if (currentActivePivot) {
                    // También usamos la búsqueda robusta aquí
                    const prev = currentActivePivot.children.find(c => c.userData.isMainModel === true);
                    if(prev) gsap.to(prev.scale, { duration: 0.5, x: prev.userData.baseScale, y: prev.userData.baseScale, z: prev.userData.baseScale })
                }
                // Activar nuevo
                const active = closestPivot.children.find(c => c.userData.isMainModel === true);
                if(active) {
                    const s = active.userData.baseScale * 1.5
                    gsap.to(active.scale, { duration: 0.6, x: s, y: s, z: s, ease: 'back.out(2)' })
                    // GSAP frena la rotación y la lleva a 0
                    gsap.to(active.rotation, { duration: 1, y: 0, ease: 'power2.out', overwrite: true })
                }
                currentActivePivot = closestPivot
            }
        }
    }

    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()