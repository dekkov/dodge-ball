import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
// import CANNON from 'cannon' 
import * as CANNON from 'cannon-es'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'




/**
 * Debug
 */
const gui = new GUI()
const debugObject = {}


const utilObject = {}

utilObject.speed = 25
utilObject.playerRadius = 1



// Reset
debugObject.reset = () =>
{
    for(const object of objectsToUpdate)
    {
        // Remove body
        object.body.removeEventListener('collide', playHitSound)
        world.removeBody(object.body)

        // Remove mesh
        scene.remove(object.mesh)
    }
    
    objectsToUpdate.splice(0, objectsToUpdate.length)
}
gui.add(debugObject, 'reset')

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Sounds
 */
const hitSound = new Audio('/sounds/hit.mp3')
const playHitSound = (collision, position) =>
{
    let distance = 0;

    if(position) {
        distance = player.position.distanceTo(position)
    }

    const impactStrength = collision.contact.getImpactVelocityAlongNormal()

    if(impactStrength > 1.5) {
        hitSound.volume = (impactStrength < 2.5) ? Math.random() * 0.3 : ((impactStrength < 4.5) ? Math.random() * 0.7 : 1)
        hitSound.currentTime = 0

        if(position) {
            if(distance > 120) hitSound.volume = 0
            else if(distance > 70) (hitSound.volume < 0.6) ? 0 : hitSound.volume -= 0.6
            else if(distance > 50) (hitSound.volume < 0.5) ? 0 : hitSound.volume -= 0.5
            else if(distance > 30) (hitSound.volume < 0.3) ? 0 : hitSound.volume -= 0.3
            else if(distance > 10) (hitSound.volume < 0.1) ? 0 : hitSound.volume -= 0.1
        }

        hitSound.play()
    }
}
/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()

const environmentMapTexture = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.png',
    '/textures/environmentMaps/0/nx.png',
    '/textures/environmentMaps/0/py.png',
    '/textures/environmentMaps/0/ny.png',
    '/textures/environmentMaps/0/pz.png',
    '/textures/environmentMaps/0/nz.png'
])

/**
 * Environment Map
 */
const rgbeLoader = new RGBELoader()
const imgUrl = new URL('./evening_road_01_puresky_4k.hdr', import.meta.url).href
rgbeLoader.load(imgUrl, (environmentMap) => {
    environmentMap.mapping = THREE.EquirectangularReflectionMapping

    scene.background = environmentMap
    scene.environment = environmentMap
})

/**
 * Physics
 */
const world = new CANNON.World()
world.broadphase = new CANNON.SAPBroadphase(world)
world.allowSleep = true
world.gravity.set(0, - 9.82, 0)

// Default material
const defaultMaterial = new CANNON.Material('default')
const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction: 0.1,
        restitution: 0.7
    }
)
world.defaultContactMaterial = defaultContactMaterial

// Floor
const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body()
floorBody.mass = 0
floorBody.addShape(floorShape)
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(- 1, 0, 0), Math.PI * 0.5) 
world.addBody(floorBody)



// Player Physics
const playerShape = new CANNON.Sphere(utilObject.playerRadius)
let playerBody = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 2, 0),
    shape: playerShape,
    material: defaultMaterial
})
playerBody.allowSleep = false
playerBody.addEventListener('collide', playHitSound)
world.addBody(playerBody)


/**
 * Utils
 */
const objectsToUpdate = []

// Create sphere
const sphereGeometry = new THREE.SphereGeometry(1, 20, 20)
const sphereMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness: 0.4,
    envMap: environmentMapTexture,
    envMapIntensity: 0.5
})

const createSphere = (radius, position) =>
{

    const sphereMaterial = new THREE.MeshStandardMaterial({
        metalness: 0.3,
        roughness: 0.4,
        envMap: environmentMapTexture,
        envMapIntensity: 0.5,
        color: new THREE.Color(Math.random(),Math.random(),Math.random())
    })
    // Three.js mesh
    const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial)
    mesh.castShadow = true
    mesh.scale.set(radius, radius, radius)
    mesh.position.copy(position)
    scene.add(mesh)
    
    

    // Cannon.js body
    const shape = new CANNON.Sphere(radius)

    const body = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0, 3, 0),
        shape: shape,
        material: defaultMaterial
    })
    body.position.copy(position)
    body.addEventListener('collide', playHitSound)
    world.addBody(body)

    // Save in objects
    objectsToUpdate.push({ mesh, body })
}



/**
 * Player
 */

 // Three.js mesh

const playerMaterial = new THREE.MeshStandardMaterial({
    color: '#89b5fa',
    metalness: 1,
    roughness: 0,
    transparent: true,
    opacity: 1
})

const player = new THREE.Mesh(
    sphereGeometry, 
    playerMaterial
)

player.scale.set(utilObject.playerRadius, utilObject.playerRadius, utilObject.playerRadius)
player.castShadow = true
player.position.x = 0
player.position.y = 1
player.position.z = 0

scene.add(player)

/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 10000),
    new THREE.MeshStandardMaterial({
        color: '#ffffff',
        metalness: 1,
        roughness: .4,
        transparent: true,
        opacity: 0.8
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

const outFloorLeft = new THREE.Mesh(
    new THREE.PlaneGeometry(52, 10000),
    new THREE.MeshStandardMaterial({
        color: '#739BD0',
        metalness: 1,
        roughness: .4,
        transparent: true,
        opacity: 0.8
    })
)
outFloorLeft.receiveShadow = true
outFloorLeft.position.x = - 52
outFloorLeft.rotation.x = - Math.PI * 0.5
scene.add(outFloorLeft)

const outFloorRight = new THREE.Mesh(
    new THREE.PlaneGeometry(52, 10000),
    new THREE.MeshStandardMaterial({
        color: '#739BD0',
        metalness: 1,
        roughness: .4,
        transparent: true,
        opacity: 0.8
    })
)
outFloorRight.receiveShadow = true
outFloorRight.position.x = 52
outFloorRight.rotation.x = - Math.PI * 0.5
scene.add(outFloorRight)

/**
 * Games
 */

let keyboard = []

document.addEventListener('keydown', (e) => {
    keyboard[e.key] = true
})

document.addEventListener('keyup', (e) => {
    keyboard[e.key] = false
})

// Player walk
const playerMove = (deltaTime) => {
    const speed = utilObject.speed
    const actualSpeed = speed * deltaTime

    // playerBody.position.z -= actualSpeed

    if(keyboard['d'] || keyboard['ArrowRight']) {
        if(playerBody.position.x <= 25) {
            playerBody.position.x += actualSpeed
        }
    }
    if(keyboard['a'] || keyboard['ArrowLeft']) {
        if(playerBody.position.x >= -25) {
            playerBody.position.x -= actualSpeed
        }
    }
}

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */

let cameraFarY = utilObject.playerRadius * 4
let cameraFarZ = utilObject.playerRadius * 5.5


// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
// camera.position.set(- 3, 3, 3)
camera.position.set(0, cameraFarY, cameraFarZ)


scene.add(camera)

// // Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))






const spawnBox = () => {
    for(let i=0; i<8; i++) {
        const radius = Math.random() + 2
        createSphere(
            radius, 
            {
                x: (Math.random() - 0.5) * 50,
                y: radius,
                z: player.position.z - (Math.random() * 100 + 70)
            }
        )
    }
}
setInterval(spawnBox, Math.random() * 200 + 1000)

// const axesHelper = new THREE.AxesHelper( 5 );
// scene.add( axesHelper );

/**
 * HTML Elements
 */
// Score
let score = document.querySelector('.score')
let highScore = document.querySelector('.high-score')
const loseLayout = document.querySelector('.lose-layout')

let scoreValue = 0
let highScoreValue = 0
let scoreAdding

const startScoreAdding = () => {
    scoreAdding = setInterval(() => {
        scoreValue += 1
        score.innerText = scoreValue
    }, 100)
}

startScoreAdding()

const stopScoreAdding = () => {
    clearInterval(scoreAdding)
}

let keepUpdating = true;
/**
 * Animate
 */
const clock = new THREE.Clock()
let oldElapsedTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime = elapsedTime

    // Update physics
    world.step(1 / 60, deltaTime, 3)
    
    for(const object of objectsToUpdate)
    {
        object.body.position.z += 0.75

        object.mesh.position.copy(object.body.position)
        object.mesh.quaternion.copy(object.body.quaternion)

        // Check distance between playerMesh and object
        if(playerBody.position.distanceTo(object.body.position) <= 3 && object.mesh.material.metalness != player.material.metalness) {
            keepUpdating = false; // Set the flag to false to stop the game loop
        }

        let timeNow = Date.now();
        let timeDifference = timeNow - object.timeAdded;
        if(timeDifference >= 7000) {
            object.body.removeEventListener('collide', playHitSound)
            world.removeBody(object.body)
            scene.remove(object.mesh)
        }
    }

    player.position.copy(playerBody.position)
    player.quaternion.copy(playerBody.quaternion)

    playerMove(deltaTime)


    
    // Render
    renderer.render(scene, camera)
    camera.lookAt(player.position)
    camera.position.z = playerBody.position.z + cameraFarZ
    camera.position.x = playerBody.position.x

    // Call tick again on the next frame
    if (keepUpdating){
        window.requestAnimationFrame(tick)
    } else {
        stopScoreAdding()
        highScoreValue = (highScoreValue < scoreValue) ? scoreValue : highScoreValue
        scoreValue = 0

        highScore.innerText = highScoreValue

        loseLayout.style.visibility = 'visible'
    }
}

tick()

/**
 * Retry
 */
const retry = () =>
{
    // Reset enemy
    for(const object of objectsToUpdate)
    {
        // Remove body
        object.body.removeEventListener('collide', playHitSound)
        world.removeBody(object.body)

        // Remove mesh
        scene.remove(object.mesh)
    }
    objectsToUpdate.splice(0, objectsToUpdate.length)

    // Reset player
    playerBody.removeEventListener('collide', playHitSound)
    world.removeBody(playerBody)

    playerBody = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0, 2, 0),
        shape: playerShape,
        material: defaultMaterial
    })
    playerBody.addEventListener('collide', playHitSound)
    
    world.addBody(playerBody)

    playerBody.position.x = 0
    playerBody.position.y = 1
    playerBody.position.z = 0


    // Start tick()
    keepUpdating = true
    tick()

    loseLayout.style.visibility = 'hidden'

    // Score
    startScoreAdding()
}

const retryButton = document.querySelector('.retry')
console.log(retryButton)

retryButton.addEventListener('click', retry)