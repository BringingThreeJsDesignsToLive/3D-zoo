import WebglExperience from "..";
import * as THREE from "three"
import elephantModel from "@/assets/elephantModelTest2.glb";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import gsap from "gsap"
import { TimeTypes } from "../types";
import Environment from "./Environment";

interface ValuesManagerType {
    tailOffset: number,
    animalsYoyoOffset: {
        "crocs": number,
        "kong": number,
        "elephant": number
    }
}


export default class Animals {
    experience: WebglExperience;
    scene: THREE.Scene;
    time: TimeTypes;
    environment: Environment;
    models: THREE.Object3D<THREE.Event>[];
    coinGroup: THREE.Group;
    headGroup: THREE.Group;
    tailGroup: THREE.Group;
    activeIndex: { prev: number, latest: number };
    currentDisplayedSide: "head" | "tail";
    activeSetUpAnimalModel!: THREE.Object3D;
    mouseCursor: THREE.Vector2;
    valueManager: ValuesManagerType;
    constructor(experience: WebglExperience, environment: Environment) {
        this.experience = experience;
        this.scene = experience.scene;
        this.time = experience.time;
        this.environment = environment;
        this.models = []
        this.coinGroup = new THREE.Group();
        this.headGroup = new THREE.Group();
        this.tailGroup = new THREE.Group();
        this.currentDisplayedSide = "head";
        this.mouseCursor = new THREE.Vector2(0);
        this.activeIndex = { prev: 0, latest: 0 };
        this.valueManager = {
            tailOffset: -47.5,
            animalsYoyoOffset: {
                "crocs": 0.5,
                "kong": 1,
                "elephant": 2
            }
        }

        this.init();


        this.handleMouseMove = this.handleMouseMove.bind(this);

        window.addEventListener("mousemove", this.handleMouseMove)
    }

    init() {
        this.loadModels()
    }

    loadModels() {
        const modelsUrl = [elephantModel];
        const gltfLoader = new GLTFLoader();
        const screenSetUps: THREE.Object3D[] = []

        modelsUrl.forEach(async (url) => {
            const gltf = await gltfLoader.loadAsync(url);

            gltf.scene.traverse((child) => {

                if (child.name.includes("set-up")) {
                    screenSetUps.push(child);
                }




                if (child.name.toLowerCase().includes("background")) {
                    child.receiveShadow = true;
                } else {
                    // animals models
                    child.castShadow = true;
                }

            })

            screenSetUps.forEach(child => {
                if (child.name === "set-up-0") {
                    this.headGroup.add(child);
                    this.setActiveAnimalModel(child);
                } else {
                    child.visible = false;
                    const animalModel = this.getSetUpAnimalModel(child);
                    animalModel.rotateY(Math.PI);
                    this.tailGroup.add(child);
                }
            })
            // Default tails group matrix
            this.tailGroup.rotateZ(Math.PI);
            this.tailGroup.position.setY(this.valueManager.tailOffset);

            // Default coinGroup matrix
            this.coinGroup.position.y = this.valueManager.tailOffset;

            this.coinGroup.add(this.headGroup, this.tailGroup);
            this.models.push(gltf.scene);
        })
        this.scene.add(this.coinGroup);


    }

    handleMouseMove(e: MouseEvent) {
        // get mouse coordinate relative to window size (0-1);
        let x = e.clientX / window.innerWidth;
        let y = e.clientY / window.innerHeight;

        // make values go from -0.25 to + 0.25
        x = (x - 0.5) * 0.5;
        y = (y - 0.5) * 0.5;

        this.mouseCursor.x = x
        this.mouseCursor.y = y

        // this.animateActiveAnimalOnMouseMove()

    }

    setActiveAnimalModel(mesh: THREE.Object3D) {
        const child = this.getSetUpAnimalModel(mesh);
        this.activeSetUpAnimalModel = child;
        this.environment.updateSunLightTarget(child);
    }

    getSetUpAnimalModel(mesh: THREE.Object3D) {
        return mesh.children.find(child => !child.name.includes("background"))!
    }


    animateActiveAnimalOnMouseMove() {
        if (this.activeSetUpAnimalModel) {
            gsap.to(this.activeSetUpAnimalModel.rotation, {
                y: this.mouseCursor.x,
                x: this.mouseCursor.y,
                duration: 4
            })
        }

    }

    update() {
        if (this.activeSetUpAnimalModel) {

            this.activeSetUpAnimalModel.position.y = 0.3 * Math.sin(this.time.elaspedTime * 0.0005) + this.valueManager.animalsYoyoOffset[this.activeSetUpAnimalModel.name as keyof ValuesManagerType["animalsYoyoOffset"]];
        }

    }

    resize() {

    }

    dispose() {
        window.removeEventListener("mousemove", this.handleMouseMove)
    }
}