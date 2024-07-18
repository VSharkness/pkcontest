// MODAL HOW TO PLAY
function openModal(imageSrc) {
    var modal = document.getElementById("howtoplay-modal");
    var modalImage = document.getElementById("howtoplay-modalImage");
    modal.style.display = "block";
    modalImage.src = imageSrc;
}

    function closeModal() {
        var modal = document.getElementById("howtoplay-modal");
        modal.style.display = "none";
}
// DOM
document.addEventListener('DOMContentLoaded', function () {
    const boxesbarContainer = document.getElementById('boxes-bar');
    const minigameContainer = document.getElementById('minigame-container');
    const maxTeam = 6;
    let pkLoadConfirmed = false;
    let chosenPkIds = [];
    let confirmedPkId = null;
    let selectedPokemonIds = [];
    let resultsStorage = [];

    // RANDOM 1-1025
    function getRandomPkId() {
        let randomPkId;
        do {
            randomPkId = Math.floor(Math.random() * 1025) + 1;
        } while (selectedPokemonIds.includes(randomPkId));
        
        selectedPokemonIds.push(randomPkId);
        return randomPkId;
    }
    

    // AUDIO
    const battleMusic = document.getElementById('battleMusic');
    const clickSound = document.getElementById("clickSound");
    //...
    const soundVolumeControl = document.getElementById('soundVolume');
    const musicVolumeControl = document.getElementById('musicVolume');
    const soundMute = document.getElementById('soundMute');
    const musicMute = document.getElementById('musicMute');
    let isSoundMuted = false;
    let isMusicMuted = false;

    function updateMuteIcon(control, muteIcon, isMuted) {
        if (isMuted || parseFloat(control.value) === 0) {
            muteIcon.classList.add('fa-volume-mute');
            muteIcon.classList.remove('fa-volume-up');
        } else {
            muteIcon.classList.remove('fa-volume-mute');
            muteIcon.classList.add('fa-volume-up');
        }
    }

    // SOUND
    soundVolumeControl.addEventListener('input', function() {
        clickSound.volume = parseFloat(this.value);
        isSoundMuted = clickSound.volume === 0;
        clickSound.muted = isSoundMuted;
        updateMuteIcon(soundVolumeControl, soundMute, isSoundMuted);
    });

    soundMute.addEventListener('click', function() {
        isSoundMuted = !isSoundMuted;
        clickSound.muted = isSoundMuted;
        updateMuteIcon(soundVolumeControl, soundMute, isSoundMuted);
    });

    // MUSIC
    musicVolumeControl.addEventListener('input', function() {
        battleMusic.volume = parseFloat(this.value);
        isMusicMuted = battleMusic.volume === 0;
        battleMusic.muted = isMusicMuted;
        updateMuteIcon(musicVolumeControl, musicMute, isMusicMuted);
    });

    musicMute.addEventListener('click', function() {
        isMusicMuted = !isMusicMuted;
        battleMusic.muted = isMusicMuted;
        updateMuteIcon(musicVolumeControl, musicMute, isMusicMuted);
    });


    // STORE IMAGE
    async function loadPkImg(pkId) {
        return new Promise((resolve) => {
            const pkImg = new Image();
            pkImg.src = `pklist/${pkId.toString().padStart(4, '0')}.png`;
            pkImg.alt = pkId.toString();
            pkImg.draggable = false;
            pkImg.onload = async () => {
                pkImg.classList.add('loaded', 'pk-image');
                resolve(pkImg);
                if (!pkLoadConfirmed) {
                    await getPkData(pkId);
                }
            };
        });
    }
    

    // SHOW IMG
    async function addRandomImgPk() {
        const pkPromises = [];
        for (let i = 0; i < 3; i++) {
            const pkId = getRandomPkId();
            pkPromises.push(loadPkImg(pkId));
        }
        const pkImgs = await Promise.all(pkPromises);
        
        pkImgs.forEach((pkImg) => {
            minigameContainer.appendChild(pkImg);
            setTimeout(() => {
                pkImg.style.opacity = '1';
            }, 100);
            pkImg.addEventListener('click', () => selectPk(pkImg), { once: true });
        });
    }
    
    

    // GET DATA (STATS)
    async function getPkData(pkId) {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pkId}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return {
            "hp": data.stats[0].base_stat,
            "attack": data.stats[1].base_stat,
            "defense": data.stats[2].base_stat,
            "spattack": data.stats[3].base_stat,
            "spdefense": data.stats[4].base_stat,
            "speed": data.stats[5].base_stat
        };
    }    

    // FIND FIRST EMPTY BOX
    function findFirstEmptyBox() {
        return Array.from(boxesbarContainer.children).find(box => !box.hasChildNodes()) || null;
    }

    // ADD SELECTED IMG TO BOXES
    function selectPk(selectedImg) {
        const firstEmptyBox = findFirstEmptyBox();
        if (firstEmptyBox) {
            const selectedClone = selectedImg.cloneNode(true);
            selectedClone.style.opacity = '1';
            selectedClone.classList.add('PkImgInBox');
            selectedClone.style.gridColumn = '2';

            const boxIndex = parseInt(firstEmptyBox.dataset.pkIndex);
            selectedClone.dataset.boxIndex = boxIndex;

            firstEmptyBox.appendChild(selectedClone);
            chosenPkIds.push(selectedImg.alt);
            minigameContainer.innerHTML = '';

            if (chosenPkIds.length < maxTeam) {
                addRandomImgPk();
                clickSound.currentTime = 0;
                clickSound.volume = soundVolumeControl.value;
                clickSound.play();
            }

            if (chosenPkIds.length >= maxTeam) {
                clickSound.currentTime = 0;
                clickSound.volume = soundVolumeControl.value;
                clickSound.play();
                contestPhaseHP();
            }

            firstEmptyBox.classList.add('box-selected');
        }
    }


                                                                    // HP CONTEST
    function contestPhaseHP() {
        console.log('HP contest start');
        const contestText = document.createElement('div');
        contestText.classList.add('contest-text');
        contestText.innerHTML = 'HP CONTEST! <br> Choose the Pokémon to participate!';
        minigameContainer.appendChild(contestText);
        contestText.offsetWidth;
        contestText.classList.add('show');
        let selectedClone = null;
        let confirmButton = null;

        // ADD CHOSEN TO GAMESCREEN
        async function addSelectedParticipant(img) {
            if (selectedClone) {
                selectedClone.remove();
            }

            if (confirmButton) {
                confirmButton.remove();
            }
    
            const pkId = img.alt.trim();
            const formattedPkId = parseInt(pkId);
            const pkData = await getPkData(formattedPkId);
    
            if (selectedPokemonIds.includes(pkId)) {
                return;
            }

            selectedClone = img.cloneNode(true);
            selectedClone.style.opacity = '1';
            selectedClone.classList.add('PkImgInBox');

            // CONFIRM BUTTON
            confirmButton = document.createElement('button');
            confirmButton.classList.add('confirm-button');
            confirmButton.style.display = 'block';
            confirmButton.innerText = 'CONFIRM';
            confirmButton.addEventListener('click', async () => {
                clickSound.play(); 
                if (!pkLoadConfirmed) {
                    clickSound.play();
                    confirmedPkId = {
                        id: pkId,
                        stats: pkData
                    };
                    console.log('Chosen:', confirmedPkId);
                    confirmButton.remove();
                    pkLoadConfirmed = true;
                    await generateSidePks(selectedClone);
                    selectedPokemonIds.push(pkId);
                } else {
                }
            });
            // CLEAN GAMESCREEN
            minigameContainer.innerHTML = '';    
            minigameContainer.appendChild(contestText);
            minigameContainer.appendChild(selectedClone);
            minigameContainer.appendChild(confirmButton);
        }

        // SIDE IMAGES
        async function generateSidePks(centerImg) {
            minigameContainer.innerHTML = '';
            const selectedPkId = parseInt(centerImg.alt.trim(), 10);
            let sidePkIds = [];

            do {
                sidePkIds = [getRandomPkId(), getRandomPkId()];
            } while (sidePkIds.includes(selectedPkId) || sidePkIds[0] === sidePkIds[1]);

            const sidePkDataPromises = sidePkIds.map(pkId => getPkData(pkId));
            const sidePkData = await Promise.all(sidePkDataPromises);
            const sideImgsPromises = sidePkIds.map(pkId => loadPkImg(pkId));
            const sideImgs = await Promise.all(sideImgsPromises);

            // OPACITY TRANSITION
            const fadeInImage = (img) => {
                img.style.opacity = '0';
                minigameContainer.appendChild(img);
                setTimeout(() => {
                    img.style.opacity = '1';
                }, 100); // Ajusta el tiempo según necesites
            };

            fadeInImage(sideImgs[0]);
            console.log('Left stats:', sidePkData[0]);

            fadeInImage(centerImg.cloneNode(true));

            fadeInImage(sideImgs[1]);
            console.log('Right stats:', sidePkData[1]);

            // START BATTLE BUTTON
            let startBattleIcon = null;

            startBattleIcon = document.createElement('img');
            startBattleIcon.classList.add('start-battle-icon', 'special-img');
            startBattleIcon.style.display = 'block';
            startBattleIcon.src = 'images/battleIcon.png';
            startBattleIcon.alt = 'Start Battle Icon';

            startBattleIcon.addEventListener('click', () => {
                clickSound.currentTime = 0;
                clickSound.volume = soundVolumeControl.value;
                clickSound.play(); 
            startBattleIcon.remove();
            startBattle();
            });
            minigameContainer.appendChild(startBattleIcon);

            setTimeout(() => {
            startBattleIcon.style.opacity = '1';
            }, 500);
        }

        // Función para esperar la selección del participante
        function waitForSelection() {
            return new Promise((resolve) => {
                const boxesbarImages = document.querySelectorAll('#boxes-bar img');
                boxesbarImages.forEach(img => {
                    img.addEventListener('click', () => {
                        clickSound.currentTime = 0;
                        clickSound.volume = soundVolumeControl.value;
                        clickSound.play();
                        if (!pkLoadConfirmed) {
                            addSelectedParticipant(img).then(() => {
                                resolve(); // Resolver la promesa cuando se confirma el Pokémon seleccionado
                            });
                        } else {
                            console.log('Ya has confirmado un Pokémon. No puedes seleccionar otro.');
                        }
                    });
                });
            });
        }

    ////////////////////////////////////////////////////////////////////////////////////////////BATALLA

        // Función para iniciar la batalla
        function startBattle() {
            console.log('Batalla comenzada');
            
            // Reproduce el sonido de sacudida
            battleMusic.currentTime = 0;
            battleMusic.volume = musicVolumeControl.value;
            battleMusic.play();

            // Obtener todas las imágenes dentro de minigameContainer
            const pkImgs = document.querySelectorAll('#minigame-container img');

            // Agitar las imágenes durante 3 segundos
        pkImgs.forEach(img => {
            img.style.transition = 'transform 0.1s ease-in-out';
            img.style.animation = 'shake 0.5s ease-in-out 5'; // Agregar clase de animación para agitar
        });

        // Esperar a que la animación termine y ejecutar el código adicional
        pkImgs[0].addEventListener('animationend', async () => {
            // Aquí empieza el nuevo código agregado después de la animación
            // Aplicar grayscale a las imágenes individuales según los resultados individuales
            const pkStats = [];
            pkStats.push(await getPkData(parseInt(pkImgs[0].alt.replace('Pk ', ''), 10)));
            pkStats.push(confirmedPkId.stats);
            pkStats.push(await getPkData(parseInt(pkImgs[2].alt.replace('Pk ', ''), 10)));

            console.log('HP del Pokémon Izquierda:', pkStats[0].hp);
            console.log('HP del Pokémon Centro:', pkStats[1].hp);
            console.log('HP del Pokémon Derecha:', pkStats[2].hp);

            // Determinar el resultado de cada Pokémon individualmente
            const results = [
                pkStats[0].hp > pkStats[1].hp && pkStats[0].hp > pkStats[2].hp ? 'win' : 'lose', // Pokémon izquierda
                pkStats[1].hp > pkStats[0].hp && pkStats[1].hp > pkStats[2].hp ? 'win' : 'lose', // Pokémon centro
                pkStats[2].hp > pkStats[0].hp && pkStats[2].hp > pkStats[1].hp ? 'win' : 'lose'  // Pokémon derecha
            ];
    // Determinar si hay empates y su tipo (ganando, perdiendo o empate con tie-win o tie-lose)
    if (pkStats[0].hp === pkStats[1].hp) {              //SI IZQUIERDA Y CENTRO EMPATAN

        if (pkStats[0].hp > pkStats[2].hp) {               //e izquierda > derecha
            results[0] = 'tie-win';                             //izquierda empata ganando
            results[1] = 'tie-win';                             //centro empata ganando
            results[2] = 'lose';                                //derecha pierde       
        } else if (pkStats[0].hp < pkStats[2].hp) {        //e izquierda < derecha
            results[0] = 'tie-lose';                            //izquierda empata perdiendo
            results[1] = 'tie-lose';                            //centro empata perdiendo 
            results[2] = 'win';                                 //derecha gana  
        }


    } else if (pkStats[0].hp === pkStats[2].hp) {       //SI IZQUIERDA Y DERECHA EMPATAN
        
        if (pkStats[0].hp > pkStats[1].hp) {               //e izquierda > centro
            results[0] = 'tie-win';                            //izquierda empata ganando
            results[1] = 'lose';                               //centro pierde
            results[2] = 'tie-win';                            //derecha empata ganando  
        } else if (pkStats[0].hp < pkStats[1].hp) {        //e izquierda < centro
            results[0] = 'tie-lose';                            //izquierda empata perdiendo
            results[1] = 'win';                                 //centro gana
            results[2] = 'tie-lose';                            //derecha empata perdiendo   
        }


    } else if (pkStats[1].hp === pkStats[2].hp) {       //SI CENTRO Y DERECHA EMPATAN
        
        if (pkStats[1].hp > pkStats[0].hp) {               //y centro > izquierda
            results[0] = 'lose';                               //izquierda pierde    
            results[1] = 'tie-win';                            //centro empata ganando
            results[2] = 'tie-win';                            //derecha empata ganando
        } else if (pkStats[1].hp < pkStats[0].hp) {        //y centro < izquierda
            results[0] = 'win';                               //izquierda gana 
            results[1] = 'tie-lose';                            //centro empata perdiendo
            results[2] = 'tie-lose';                            //derecha empata perdiendo
        }


    } else if (pkStats[0].defense === pkStats[1].defense && pkStats[0].defense === pkStats[2].defense) {     //SI LOS 3 EMPATAN
            results[0] = 'tie-win';                             //izquierda empata ganando
            results[1] = 'tie-win';                             //centro empata ganando
            results[2] = 'tie-win';                                //derecha pierde       
        }



        // Determinar el resultado final basado en el resultado del Pokémon Centro
        let finalResult;
        if (results[1] === 'win') {
            finalResult = 'Victory!';
        } else if (results[1] === 'lose') {
            finalResult = 'Lose!';
        } else if (results[1] === 'tie-win') {
            finalResult = 'Tie!';
        } else if (results[1] === 'tie-lose') {
            finalResult = 'Lose!';
        }

        // Almacenar el resultado en la variable global
        resultsStorage.push(finalResult);   

            // Mostrar resultados individuales de cada Pokémon y resultado final
            console.log(`Resultado del Pokémon Izquierda: ${results[0]}`);
            console.log(`Resultado del Pokémon Centro: ${results[1]}`);
            console.log(`Resultado del Pokémon Derecha: ${results[2]}`);
            console.log(`Resultado Final: ${finalResult}`);

    // Datos de configuración para los contenedores y elementos
    const containerClasses = ['result-container', 'result-container2', 'result-container3'];
    const elementClasses = ['result-text', 'result-text2', 'result-text3'];

    // Crear y agregar los contenedores principales y elementos de resultado
    containerClasses.forEach((containerClass, index) => {
        const resultContainer = document.createElement('div');
        resultContainer.className = containerClass;

        const resultElement = document.createElement('div');
        resultElement.className = elementClasses[index];
        resultElement.innerHTML = `${pkStats[index].hp}`;
        resultContainer.appendChild(resultElement);

        document.getElementById('minigame-container').appendChild(resultContainer);
    });


    // Aplicar efectos visuales a las imágenes según los resultados
    pkImgs.forEach((img, index) => {
        if (index === 1) { // Pokémon centro
            if (results[1] === 'lose' || results[1] === 'tie-lose') {
                img.style.filter = 'grayscale(100%)'; // Convertir a escala de grises si pierde
            }
        } else { // Pokémon izquierda y derecha (0 y 2)
            if (results[index] === 'lose' || results[index] === 'tie-lose') {
                img.style.filter = 'grayscale(100%)'; // Convertir a escala de grises si pierde
            }
        }
    });
        
    // Obtener el ID del Pokémon central seleccionado
    const selectedPkId = confirmedPkId.id;

    // Encontrar el box que contiene la imagen correcta
    const selectedBox = Array.from(boxesbarContainer.children).find(box => {
        // Buscar la imagen dentro del box que tenga las clases y el ID correcto
        const img = box.querySelector('.loaded.PkImgInBox');
        if (img && img.alt === selectedPkId) {
            return true;
        }
        return false;
    });

    if (selectedBox) {
        let borderColor = '';
        let backgroundimage = '';

        if (finalResult === 'Victory!') {
            borderColor = '#71d15d';  // Color verde para victoria
    
        } else if (finalResult === 'Lose!') {
            borderColor = '#d15d5d';    // Color rojo para derrota
    
        } else if (finalResult === 'Tie!') {
            borderColor = 'yellow'; // Color amarillo para empate
    
        }

        if (borderColor) {
            selectedBox.style.borderColor = borderColor;
        } else {
            console.error('Resultado final desconocido:', finalResult);
        }

        // Crear el botón "Continuar"
        const continueButton = document.createElement('button');
        continueButton.classList.add('continue-button');
        continueButton.style.display = 'block';
        continueButton.innerText = 'Continue...';

        continueButton.addEventListener('click', () => {
            clickSound.currentTime = 0;
            clickSound.volume = soundVolumeControl.value;
            clickSound.play();
            continueButton.remove(); // Eliminar el botón al iniciar la fase Attack
            minigameContainer.innerHTML = '';                           //Limpia el minigameContainer
            pkLoadConfirmed = false; // Marcar que la imagen y los datos están confirmados
            console.log(resultsStorage)
            contestPhaseAttack();
        });

        // Añadir el botón "Continuar" al contenedor del minijuego
        document.getElementById('minigame-container').appendChild(continueButton);



    } else {
        console.error('No se encontró la caja seleccionada.');
    }

        });
    }
        // Espera a que se seleccione un participante
        waitForSelection();
        console.log('Contest Phase HP ended');

} //termina contest HP



                                                                            // ATTACK CONTEST
function contestPhaseAttack() {
    console.log('Contest Phase Attack started');
    console.log(selectedPokemonIds)

    // Muestra el texto en el container
    const contestText = document.createElement('div');
    contestText.classList.add('contest-text');
    contestText.innerHTML = 'ATTACK CONTEST! <br> Choose the Pokémon to participate!';
    minigameContainer.appendChild(contestText);
    contestText.offsetWidth;
    contestText.classList.add('show');
    let selectedClone = null;
    let confirmButton = null;


    // Función para agregar el participante seleccionado al minigame-container
    async function addSelectedParticipant(img) {
        if (selectedClone) {
            selectedClone.remove(); // Elimina el Pokémon seleccionado previamente si existe
        }
        if (confirmButton) {
            confirmButton.remove(); // Elimina el botón de confirmar si existe
        }

        const pkId = img.alt.trim(); // Obtener la ID del Pokémon seleccionado y eliminar espacios en blanco alrededor
        if (selectedPokemonIds.includes(pkId)) {
            console.log('Este Pokémon ya ha sido seleccionado en la fase anterior. No puedes elegirlo de nuevo.');
            return;
        }
        const formattedPkId = parseInt(pkId); // Obtener el número de la ID del Pokémon
        const pkData = await getPkData(formattedPkId); // Obtener los stats del Pokémon usando la función getPkData

        selectedClone = img.cloneNode(true); // Clona la imagen seleccionada
        selectedClone.style.opacity = '1';
        selectedClone.classList.add('PkImgInBox');

        // Crear botón de confirmar
        confirmButton = document.createElement('button');
        confirmButton.classList.add('confirm-button');
        confirmButton.style.display = 'block';
        confirmButton.innerText = 'CONFIRM';
        // Evento de clic en el botón de confirmar
        confirmButton.addEventListener('click', async () => {
            clickSound.currentTime = 0;
            clickSound.volume = soundVolumeControl.value;
            clickSound.play(); 
            if (!pkLoadConfirmed) {
                confirmedPkId = {
                    id: pkId,
                    stats: pkData // Guardar la ID y los stats del Pokémon seleccionado en confirmedPkId
                };
                console.log('ID y stats del Pokémon seleccionado:', confirmedPkId);
                confirmButton.remove();
                pkLoadConfirmed = true; // Marcar que la imagen y los datos están confirmados
                await generateSidePks(selectedClone); //Pasa a generateSidePks
                
                // Agregar la ID al registro de Pokémon seleccionados
                selectedPokemonIds.push(pkId);
            } else {
                console.log('Ya has confirmado un Pokémon. No puedes seleccionar otro.');
            }
        });

        // Limpiar el minigameContainer antes de añadir el nuevo participante
        minigameContainer.innerHTML = '';    
        minigameContainer.appendChild(contestText); // Agrega el texto de concurso de Attack
        minigameContainer.appendChild(selectedClone); // Añade el clon del Pokémon seleccionado al minigameContainer
        minigameContainer.appendChild(confirmButton); // Añade el botón de confirmar al minigameContainer
    }

// Función asincrónica para generar los Pokémon laterales sin repetirse
async function generateSidePks(centerImg) {
    minigameContainer.innerHTML = '';

    const selectedPkId = parseInt(centerImg.alt.trim(), 10);

    let sidePkIds = [];
    do {
        sidePkIds = [getRandomPkId(), getRandomPkId()];
    } while (sidePkIds.includes(selectedPkId) || sidePkIds[0] === sidePkIds[1]);

    const sidePkDataPromises = sidePkIds.map(pkId => getPkData(pkId));
    const sidePkData = await Promise.all(sidePkDataPromises);

    const sideImgsPromises = sidePkIds.map(pkId => loadPkImg(pkId));
    const sideImgs = await Promise.all(sideImgsPromises);

    // const sidecentercontainer = document.createElement('div');
    // sidecentercontainer.classList.add('side-center');

    // Función para gestionar la transición de opacidad
    const fadeInImage = (img) => {
        img.style.opacity = '0';
        minigameContainer.appendChild(img);
        setTimeout(() => {
            img.style.opacity = '1';
        }, 100); // Ajusta el tiempo según necesites
    };

    // Mostrar la primera imagen lateral con transición de opacidad
    fadeInImage(sideImgs[0]);
    console.log('Stats del Pokémon izquierdo:', sidePkData[0]);

    // Mostrar la imagen central con la misma transición de opacidad
    fadeInImage(centerImg.cloneNode(true));

    // Mostrar la segunda imagen lateral con transición de opacidad
    fadeInImage(sideImgs[1]);
    console.log('Stats del Pokémon derecho:', sidePkData[1]);



// Crear botón "Comenzar batalla"
let startBattleIcon = null;

// Añadir el botón "Comenzar batalla" con un delay de 3 segundos

    startBattleIcon = document.createElement('img');
    startBattleIcon.classList.add('start-battle-icon', 'special-img'); // Añadir clase 'special-img'
    startBattleIcon.style.display = 'block'; // Mostrar el botón
    startBattleIcon.src = 'images/battleIcon.png'; // Ruta a la imagen
    startBattleIcon.alt = 'Start Battle Icon';

    startBattleIcon.addEventListener('click', () => {
        clickSound.currentTime = 0;
        clickSound.volume = soundVolumeControl.value;
        clickSound.play(); 
      startBattleIcon.remove(); // Remover la imagen al iniciar la batalla
    startBattle();
    });

    minigameContainer.appendChild(startBattleIcon);

    // Activar la transición estableciendo la opacidad a 1 después de un breve retardo
    setTimeout(() => {
    startBattleIcon.style.opacity = '1';
    }, 500); // Un pequeño retardo para asegurar que la transición funcione bien
}

// Función para esperar la selección del participante
function waitForSelection() {
    return new Promise((resolve) => {
        const boxesbarImages = document.querySelectorAll('#boxes-bar img');
        boxesbarImages.forEach(img => {
            img.addEventListener('click', () => {
                if (!pkLoadConfirmed) {
                    addSelectedParticipant(img); // Añade el participante seleccionado al minigame-container solo si no se ha confirmado otro previamente
                } else {
                    console.log('Ya has confirmado un Pokémon. No puedes seleccionar otro.');
                }
            });
        });
    });
}

////////////////////////////////////////////////////////////////////////////////////////////BATALLA

    // Función para iniciar la batalla
    function startBattle() {
        console.log('Batalla comenzada');
        
        // Reproduce el sonido de sacudida
        
        battleMusic.currentTime = 0;
        battleMusic.volume = musicVolumeControl.value;
        battleMusic.play();

        // Obtener todas las imágenes dentro de minigameContainer
        const pkImgs = document.querySelectorAll('#minigame-container img');

        // Agitar las imágenes durante 3 segundos
    pkImgs.forEach(img => {
        img.style.transition = 'transform 0.1s ease-in-out';
        img.style.animation = 'shake 0.5s ease-in-out 5'; // Agregar clase de animación para agitar
    });

    // Esperar a que la animación termine y ejecutar el código adicional
    pkImgs[0].addEventListener('animationend', async () => {
        // Aquí empieza el nuevo código agregado después de la animación
        // Aplicar grayscale a las imágenes individuales según los resultados individuales
        const pkStats = [];
        pkStats.push(await getPkData(parseInt(pkImgs[0].alt.replace('Pk ', ''), 10)));
        pkStats.push(confirmedPkId.stats);
        pkStats.push(await getPkData(parseInt(pkImgs[2].alt.replace('Pk ', ''), 10)));

        console.log('Attack del Pokémon Izquierda:', pkStats[0].attack);
        console.log('Attack del Pokémon Centro:', pkStats[1].attack);
        console.log('Attack del Pokémon Derecha:', pkStats[2].attack);

        // Determinar el resultado de cada Pokémon individualmente
        const results = [
            pkStats[0].attack > pkStats[1].attack && pkStats[0].attack > pkStats[2].attack ? 'win' : 'lose', // Pokémon izquierda
            pkStats[1].attack > pkStats[0].attack && pkStats[1].attack > pkStats[2].attack ? 'win' : 'lose', // Pokémon centro
            pkStats[2].attack > pkStats[0].attack && pkStats[2].attack > pkStats[1].attack ? 'win' : 'lose'  // Pokémon derecha
        ];
// Determinar si hay empates y su tipo (ganando, perdiendo o empate con tie-win o tie-lose)
if (pkStats[0].attack === pkStats[1].attack) {              //SI IZQUIERDA Y CENTRO EMPATAN

    if (pkStats[0].attack > pkStats[2].attack) {               //e izquierda > derecha
        results[0] = 'tie-win';                             //izquierda empata ganando
        results[1] = 'tie-win';                             //centro empata ganando
        results[2] = 'lose';                                //derecha pierde       
    } else if (pkStats[0].attack < pkStats[2].attack) {        //e izquierda < derecha
        results[0] = 'tie-lose';                            //izquierda empata perdiendo
        results[1] = 'tie-lose';                            //centro empata perdiendo 
        results[2] = 'win';                                 //derecha gana  
    }


} else if (pkStats[0].attack === pkStats[2].attack) {       //SI IZQUIERDA Y DERECHA EMPATAN
    
    if (pkStats[0].attack > pkStats[1].attack) {               //e izquierda > centro
        results[0] = 'tie-win';                            //izquierda empata ganando
        results[1] = 'lose';                               //centro pierde
        results[2] = 'tie-win';                            //derecha empata ganando  
    } else if (pkStats[0].attack < pkStats[1].attack) {        //e izquierda < centro
        results[0] = 'tie-lose';                            //izquierda empata perdiendo
        results[1] = 'win';                                 //centro gana
        results[2] = 'tie-lose';                            //derecha empata perdiendo   
    }


} else if (pkStats[1].attack === pkStats[2].attack) {       //SI CENTRO Y DERECHA EMPATAN
    
    if (pkStats[1].attack > pkStats[0].attack) {               //y centro > izquierda
        results[0] = 'lose';                               //izquierda pierde    
        results[1] = 'tie-win';                            //centro empata ganando
        results[2] = 'tie-win';                            //derecha empata ganando
    } else if (pkStats[1].attack < pkStats[0].attack) {        //y centro < izquierda
        results[0] = 'win';                               //izquierda gana 
        results[1] = 'tie-lose';                            //centro empata perdiendo
        results[2] = 'tie-lose';                            //derecha empata perdiendo
    }


} else if (pkStats[0].defense === pkStats[1].defense && pkStats[0].defense === pkStats[2].defense) {     //SI LOS 3 EMPATAN
        results[0] = 'tie-win';                             //izquierda empata ganando
        results[1] = 'tie-win';                             //centro empata ganando
        results[2] = 'tie-win';                                //derecha pierde       
    }



    // Determinar el resultado final basado en el resultado del Pokémon Centro
    let finalResult;
    if (results[1] === 'win') {
        finalResult = 'Victory!';
    } else if (results[1] === 'lose') {
        finalResult = 'Lose!';
    } else if (results[1] === 'tie-win') {
        finalResult = 'Tie!';
    } else if (results[1] === 'tie-lose') {
        finalResult = 'Lose!';
    }

    // Almacenar el resultado en la variable global
    resultsStorage.push(finalResult);

        // Mostrar resultados individuales de cada Pokémon y resultado final
        console.log(`Resultado del Pokémon Izquierda: ${results[0]}`);
        console.log(`Resultado del Pokémon Centro: ${results[1]}`);
        console.log(`Resultado del Pokémon Derecha: ${results[2]}`);
        console.log(`Resultado Final: ${finalResult}`);

// Crear el contenedor principal para los resultados
const resultContainer = document.createElement('div');
resultContainer.className = 'result-container'; // Añadir una clase al contenedor principal

// Datos de configuración para los contenedores y elementos
const containerClasses = ['result-container', 'result-container2', 'result-container3'];
const elementClasses = ['result-text', 'result-text2', 'result-text3'];

// Crear y agregar los contenedores principales y elementos de resultado
containerClasses.forEach((containerClass, index) => {
    const resultContainer = document.createElement('div');
    resultContainer.className = containerClass;

    const resultElement = document.createElement('div');
    resultElement.className = elementClasses[index];
    resultElement.innerHTML = `${pkStats[index].hp}`;
    resultContainer.appendChild(resultElement);

    document.getElementById('minigame-container').appendChild(resultContainer);
});

 // Aplicar efectos visuales a las imágenes según los resultados
 pkImgs.forEach((img, index) => {
    if (index === 1) { // Pokémon centro
        if (results[1] === 'lose' || results[1] === 'tie-lose') {
            img.style.filter = 'grayscale(100%)'; // Convertir a escala de grises si pierde
        }
    } else { // Pokémon izquierda y derecha (0 y 2)
        if (results[index] === 'lose' || results[index] === 'tie-lose') {
            img.style.filter = 'grayscale(100%)'; // Convertir a escala de grises si pierde
        }
    }
});
    
// Obtener el ID del Pokémon central seleccionado
const selectedPkId = confirmedPkId.id;

// Encontrar el box que contiene la imagen correcta
const selectedBox = Array.from(boxesbarContainer.children).find(box => {
    // Buscar la imagen dentro del box que tenga las clases y el ID correcto
    const img = box.querySelector('.loaded.PkImgInBox');
    if (img && img.alt === selectedPkId) {
        return true;
    }
    return false;
});

if (selectedBox) {
    let borderColor = '';
    let backgroundimage = '';

    if (finalResult === 'Victory!') {
        borderColor = '#71d15d';  // Color verde para victoria
 
    } else if (finalResult === 'Lose!') {
        borderColor = '#d15d5d';    // Color rojo para derrota
 
    } else if (finalResult === 'Tie!') {
        borderColor = 'yellow'; // Color amarillo para empate
 
    }

    if (borderColor) {
        selectedBox.style.borderColor = borderColor;
    } else {
        console.error('Resultado final desconocido:', finalResult);
    }

    // Crear el botón "Continuar"
    const continueButton = document.createElement('button');
    continueButton.classList.add('continue-button');
    continueButton.style.display = 'block';
    continueButton.innerText = 'Continue...';

    continueButton.addEventListener('click', () => {
        clickSound.currentTime = 0;
        clickSound.volume = soundVolumeControl.value;
        clickSound.play(); 
        continueButton.remove(); // Eliminar el botón al iniciar la fase Attack
        minigameContainer.innerHTML = '';                           //Limpia el minigameContainer
        pkLoadConfirmed = false; // Marcar que la imagen y los datos están confirmados
        console.log(resultsStorage)
        contestPhaseDefense();
    });

    // Añadir el botón "Continuar" al contenedor del minijuego
    document.getElementById('minigame-container').appendChild(continueButton);



} else {
    console.error('No se encontró la caja seleccionada.');
}

    });
}
    // Espera a que se seleccione un participante
    waitForSelection();

    console.log('Contest Phase attack ended');

} //termina contest attack


                                                                            // DEFENSE CONTEST
function contestPhaseDefense() {
    console.log('Contest Phase Defense started');
    console.log(selectedPokemonIds)
    // Muestra el texto en el container
    const contestText = document.createElement('div');
    contestText.classList.add('contest-text');
    contestText.innerHTML = 'DEFENSE CONTEST <br> Choose the Pokémon to participate!';
    minigameContainer.appendChild(contestText);
    contestText.offsetWidth;
    contestText.classList.add('show');
    let selectedClone = null;
    let confirmButton = null;


    // Función para agregar el participante seleccionado al minigame-container
    async function addSelectedParticipant(img) {
        if (selectedClone) {
            selectedClone.remove(); // Elimina el Pokémon seleccionado previamente si existe
        }
        if (confirmButton) {
            confirmButton.remove(); // Elimina el botón de confirmar si existe
        }

        const pkId = img.alt.trim(); // Obtener la ID de los Pokémon seleccionado y eliminar espacios en blanco alrededor
        if (selectedPokemonIds.includes(pkId)) {
            console.log('Este Pokémon ya ha sido seleccionado en la fase anterior. No puedes elegirlo de nuevo.');
            return;
        }
        const formattedPkId = parseInt(pkId); // Obtener el número de la ID del Pokémon
        const pkData = await getPkData(formattedPkId); // Obtener los stats del Pokémon usando la función getPkData

        selectedClone = img.cloneNode(true); // Clona la imagen seleccionada
        selectedClone.style.opacity = '1';
        selectedClone.classList.add('PkImgInBox');

        // Crear botón de confirmar
        confirmButton = document.createElement('button');
        confirmButton.classList.add('confirm-button');
        confirmButton.style.display = 'block';
        confirmButton.innerText = 'CONFIRM';
        // Evento de clic en el botón de confirmar
        confirmButton.addEventListener('click', async () => {
            clickSound.currentTime = 0;
            clickSound.volume = soundVolumeControl.value;
            clickSound.play(); 
            if (!pkLoadConfirmed) {
                confirmedPkId = {
                    id: pkId,
                    stats: pkData // Guardar la ID y los stats del Pokémon seleccionado en confirmedPkId
                };
                console.log('ID y stats del Pokémon seleccionado:', confirmedPkId);
                confirmButton.remove();
                pkLoadConfirmed = true; // Marcar que la imagen y los datos están confirmados
                await generateSidePks(selectedClone); //Pasa a generateSidePks
                // Agregar la ID al registro de Pokémon seleccionados
                selectedPokemonIds.push(pkId);
            } else {
                console.log('Ya has confirmado un Pokémon. No puedes seleccionar otro.');
            }
        });

        // Limpiar el minigameContainer antes de añadir el nuevo participante
        minigameContainer.innerHTML = '';    
        minigameContainer.appendChild(contestText); // Agrega el texto de concurso de Defense
        minigameContainer.appendChild(selectedClone); // Añade el clon del Pokémon seleccionado al minigameContainer
        minigameContainer.appendChild(confirmButton); // Añade el botón de confirmar al minigameContainer
    }

// Función asincrónica para generar los Pokémon laterales sin repetirse
async function generateSidePks(centerImg) {
    minigameContainer.innerHTML = '';

    const selectedPkId = parseInt(centerImg.alt.trim(), 10);

    let sidePkIds = [];
    do {
        sidePkIds = [getRandomPkId(), getRandomPkId()];
    } while (sidePkIds.includes(selectedPkId) || sidePkIds[0] === sidePkIds[1]);

    const sidePkDataPromises = sidePkIds.map(pkId => getPkData(pkId));
    const sidePkData = await Promise.all(sidePkDataPromises);

    const sideImgsPromises = sidePkIds.map(pkId => loadPkImg(pkId));
    const sideImgs = await Promise.all(sideImgsPromises);

    // const sidecentercontainer = document.createElement('div');
    // sidecentercontainer.classList.add('side-center');

    // Función para gestionar la transición de opacidad
    const fadeInImage = (img) => {
        img.style.opacity = '0';
        minigameContainer.appendChild(img);
        setTimeout(() => {
            img.style.opacity = '1';
        }, 100); // Ajusta el tiempo según necesites
    };

    // Mostrar la primera imagen lateral con transición de opacidad
    fadeInImage(sideImgs[0]);
    console.log('Stats del Pokémon izquierdo:', sidePkData[0]);

    // Mostrar la imagen central con la misma transición de opacidad
    fadeInImage(centerImg.cloneNode(true));

    // Mostrar la segunda imagen lateral con transición de opacidad
    fadeInImage(sideImgs[1]);
    console.log('Stats del Pokémon derecho:', sidePkData[1]);

    // minigameContainer.appendChild(sidecentercontainer);

// Crear botón "Comenzar batalla"
let startBattleIcon = null;

// Añadir el botón "Comenzar batalla" con un delay de 3 segundos

    startBattleIcon = document.createElement('img');
    startBattleIcon.classList.add('start-battle-icon', 'special-img'); // Añadir clase 'special-img'
    startBattleIcon.style.display = 'block'; // Mostrar el botón
    startBattleIcon.src = 'images/battleIcon.png'; // Ruta a la imagen
    startBattleIcon.alt = 'Start Battle Icon';

    startBattleIcon.addEventListener('click', () => {
        clickSound.currentTime = 0;
        clickSound.volume = soundVolumeControl.value;
        clickSound.play(); 
      startBattleIcon.remove(); // Remover la imagen al iniciar la batalla
    startBattle();
    });

    minigameContainer.appendChild(startBattleIcon);

    // Activar la transición estableciendo la opacidad a 1 después de un breve retardo
    setTimeout(() => {
    startBattleIcon.style.opacity = '1';
    }, 500); // Un pequeño retardo para asegurar que la transición funcione bien
}

// Función para esperar la selección del participante
function waitForSelection() {
    return new Promise((resolve) => {
        const boxesbarImages = document.querySelectorAll('#boxes-bar img');
        boxesbarImages.forEach(img => {
            img.addEventListener('click', () => {
                if (!pkLoadConfirmed) {
                    addSelectedParticipant(img); // Añade el participante seleccionado al minigame-container solo si no se ha confirmado otro previamente
                } else {
                    console.log('Ya has confirmado un Pokémon. No puedes seleccionar otro.');
                }
            });
        });
    });
}

////////////////////////////////////////////////////////////////////////////////////////////BATALLA

    // Función para iniciar la batalla
    function startBattle() {
        console.log('Batalla comenzada');
        
        // Reproduce el sonido de sacudida
        
        battleMusic.currentTime = 0;
        battleMusic.volume = musicVolumeControl.value;
        battleMusic.play();

        // Obtener todas las imágenes dentro de minigameContainer
        const pkImgs = document.querySelectorAll('#minigame-container img');

        // Agitar las imágenes durante 3 segundos
    pkImgs.forEach(img => {
        img.style.transition = 'transform 0.1s ease-in-out';
        img.style.animation = 'shake 0.5s ease-in-out 5'; // Agregar clase de animación para agitar
    });

    // Esperar a que la animación termine y ejecutar el código adicional
    pkImgs[0].addEventListener('animationend', async () => {
        // Aquí empieza el nuevo código agregado después de la animación
        // Aplicar grayscale a las imágenes individuales según los resultados individuales
        const pkStats = [];
        pkStats.push(await getPkData(parseInt(pkImgs[0].alt.replace('Pk ', ''), 10)));
        pkStats.push(confirmedPkId.stats);
        pkStats.push(await getPkData(parseInt(pkImgs[2].alt.replace('Pk ', ''), 10)));

        console.log('Defense del Pokémon Izquierda:', pkStats[0].defense);
        console.log('Defense del Pokémon Centro:', pkStats[1].defense);
        console.log('Defense del Pokémon Derecha:', pkStats[2].defense);

        // Determinar el resultado de cada Pokémon individualmente
        const results = [
            pkStats[0].defense > pkStats[1].defense && pkStats[0].defense > pkStats[2].defense ? 'win' : 'lose', // Pokémon izquierda
            pkStats[1].defense > pkStats[0].defense && pkStats[1].defense > pkStats[2].defense ? 'win' : 'lose', // Pokémon centro
            pkStats[2].defense > pkStats[0].defense && pkStats[2].defense > pkStats[1].defense ? 'win' : 'lose'  // Pokémon derecha
        ];
// Determinar si hay empates y su tipo (ganando, perdiendo o empate con tie-win o tie-lose)
if (pkStats[0].defense === pkStats[1].defense) {              //SI IZQUIERDA Y CENTRO EMPATAN

    if (pkStats[0].defense > pkStats[2].defense) {               //e izquierda > derecha
        results[0] = 'tie-win';                             //izquierda empata ganando
        results[1] = 'tie-win';                             //centro empata ganando
        results[2] = 'lose';                                //derecha pierde       
    } else if (pkStats[0].defense < pkStats[2].defense) {        //e izquierda < derecha
        results[0] = 'tie-lose';                            //izquierda empata perdiendo
        results[1] = 'tie-lose';                            //centro empata perdiendo 
        results[2] = 'win';                                 //derecha gana  
    }


} else if (pkStats[0].defense === pkStats[2].defense) {       //SI IZQUIERDA Y DERECHA EMPATAN
    
    if (pkStats[0].defense > pkStats[1].defense) {               //e izquierda > centro
        results[0] = 'tie-win';                            //izquierda empata ganando
        results[1] = 'lose';                               //centro pierde
        results[2] = 'tie-win';                            //derecha empata ganando  
    } else if (pkStats[0].defense < pkStats[1].defense) {        //e izquierda < centro
        results[0] = 'tie-lose';                            //izquierda empata perdiendo
        results[1] = 'win';                                 //centro gana
        results[2] = 'tie-lose';                            //derecha empata perdiendo   
    }


} else if (pkStats[1].defense === pkStats[2].defense) {       //SI CENTRO Y DERECHA EMPATAN
    
    if (pkStats[1].defense > pkStats[0].defense) {               //y centro > izquierda
        results[0] = 'lose';                               //izquierda pierde    
        results[1] = 'tie-win';                            //centro empata ganando
        results[2] = 'tie-win';                            //derecha empata ganando
    } else if (pkStats[1].defense < pkStats[0].defense) {        //y centro < izquierda
        results[0] = 'win';                               //izquierda gana 
        results[1] = 'tie-lose';                            //centro empata perdiendo
        results[2] = 'tie-lose';                            //derecha empata perdiendo
    }


} else if (pkStats[0].defense === pkStats[1].defense && pkStats[0].defense === pkStats[2].defense) {     //SI LOS 3 EMPATAN
        results[0] = 'tie-win';                             //izquierda empata ganando
        results[1] = 'tie-win';                             //centro empata ganando
        results[2] = 'tie-win';                                //derecha pierde       
    }



    // Determinar el resultado final basado en el resultado del Pokémon Centro
    let finalResult;
    if (results[1] === 'win') {
        finalResult = 'Victory!';
    } else if (results[1] === 'lose') {
        finalResult = 'Lose!';
    } else if (results[1] === 'tie-win') {
        finalResult = 'Tie!';
    } else if (results[1] === 'tie-lose') {
        finalResult = 'Lose!';
    }

    // Almacenar el resultado en la variable global
    resultsStorage.push(finalResult);

        // Mostrar resultados individuales de cada Pokémon y resultado final
        console.log(`Resultado del Pokémon Izquierda: ${results[0]}`);
        console.log(`Resultado del Pokémon Centro: ${results[1]}`);
        console.log(`Resultado del Pokémon Derecha: ${results[2]}`);
        console.log(`Resultado Final: ${finalResult}`);

// Crear el contenedor principal para los resultados
const resultContainer = document.createElement('div');
resultContainer.className = 'result-container'; // Añadir una clase al contenedor principal

// Datos de configuración para los contenedores y elementos
const containerClasses = ['result-container', 'result-container2', 'result-container3'];
const elementClasses = ['result-text', 'result-text2', 'result-text3'];

// Crear y agregar los contenedores principales y elementos de resultado
containerClasses.forEach((containerClass, index) => {
    const resultContainer = document.createElement('div');
    resultContainer.className = containerClass;

    const resultElement = document.createElement('div');
    resultElement.className = elementClasses[index];
    resultElement.innerHTML = `${pkStats[index].hp}`;
    resultContainer.appendChild(resultElement);

    document.getElementById('minigame-container').appendChild(resultContainer);
});


 // Aplicar efectos visuales a las imágenes según los resultados
pkImgs.forEach((img, index) => {
    if (index === 1) { // Pokémon centro
        if (results[1] === 'lose' || results[1] === 'tie-lose') {
            img.style.filter = 'grayscale(100%)'; // Convertir a escala de grises si pierde
        }
    } else { // Pokémon izquierda y derecha (0 y 2)
        if (results[index] === 'lose' || results[index] === 'tie-lose') {
            img.style.filter = 'grayscale(100%)'; // Convertir a escala de grises si pierde
        }
    }
});
    
// Obtener el ID del Pokémon central seleccionado
const selectedPkId = confirmedPkId.id;

// Encontrar el box que contiene la imagen correcta
const selectedBox = Array.from(boxesbarContainer.children).find(box => {
    // Buscar la imagen dentro del box que tenga las clases y el ID correcto
    const img = box.querySelector('.loaded.PkImgInBox');
    if (img && img.alt === selectedPkId) {
        return true;
    }
    return false;
});

if (selectedBox) {
    let borderColor = '';
    let backgroundimage = '';

    if (finalResult === 'Victory!') {
        borderColor = '#71d15d';  // Color verde para victoria

    } else if (finalResult === 'Lose!') {
        borderColor = '#d15d5d';    // Color rojo para derrota

    } else if (finalResult === 'Tie!') {
        borderColor = 'yellow'; // Color amarillo para empate

    }

    if (borderColor) {
        selectedBox.style.borderColor = borderColor;
    } else {
        console.error('Resultado final desconocido:', finalResult);
    }

    // Crear el botón "Continuar"
    const continueButton = document.createElement('button');
    continueButton.classList.add('continue-button');
    continueButton.style.display = 'block';
    continueButton.innerText = 'Continue...';

    continueButton.addEventListener('click', () => {
        clickSound.currentTime = 0;
        clickSound.volume = soundVolumeControl.value;
        clickSound.play(); 
        continueButton.remove(); // Eliminar el botón al iniciar la fase Defense
        minigameContainer.innerHTML = '';                           //Limpia el minigameContainer
        pkLoadConfirmed = false; // Marcar que la imagen y los datos están confirmados
        console.log(resultsStorage)
        contestPhaseSpAttack();
    });

    // Añadir el botón "Continuar" al contenedor del minijuego
    document.getElementById('minigame-container').appendChild(continueButton);



} else {
    console.error('No se encontró la caja seleccionada.');
}

    });
}
    // Espera a que se seleccione un participante
    waitForSelection();

    console.log('Contest Phase defense ended');

} //termina contest defense

                                                                            // SPATTACK CONTEST
function contestPhaseSpAttack() {
    console.log('Contest Phase SpAttack started');
    console.log(selectedPokemonIds)
    // Muestra el texto en el container
    const contestText = document.createElement('div');
    contestText.classList.add('contest-text');
    contestText.innerHTML = 'SP. ATTACK CONTEST! <br> Choose the Pokémon to participate!';
    minigameContainer.appendChild(contestText);
    contestText.offsetWidth;
    contestText.classList.add('show');
    let selectedClone = null;
    let confirmButton = null;


    // Función para agregar el participante seleccionado al minigame-container
    async function addSelectedParticipant(img) {
        if (selectedClone) {
            selectedClone.remove(); // Elimina el Pokémon seleccionado previamente si existe
        }
        if (confirmButton) {
            confirmButton.remove(); // Elimina el botón de confirmar si existe
        }

        const pkId = img.alt.trim(); // Obtener la ID de los Pokémon seleccionado y eliminar espacios en blanco alrededor
        if (selectedPokemonIds.includes(pkId)) {
            console.log('Este Pokémon ya ha sido seleccionado en la fase anterior. No puedes elegirlo de nuevo.');
            return;
        }
        const formattedPkId = parseInt(pkId); // Obtener el número de la ID del Pokémon
        const pkData = await getPkData(formattedPkId); // Obtener los stats del Pokémon usando la función getPkData

        selectedClone = img.cloneNode(true); // Clona la imagen seleccionada
        selectedClone.style.opacity = '1';
        selectedClone.classList.add('PkImgInBox');

        // Crear botón de confirmar
        confirmButton = document.createElement('button');
        confirmButton.classList.add('confirm-button');
        confirmButton.style.display = 'block';
        confirmButton.innerText = 'CONFIRM';
        // Evento de clic en el botón de confirmar
        confirmButton.addEventListener('click', async () => {
            clickSound.currentTime = 0;
            clickSound.volume = soundVolumeControl.value;
            clickSound.play(); 
            if (!pkLoadConfirmed) {
                confirmedPkId = {
                    id: pkId,
                    stats: pkData // Guardar la ID y los stats del Pokémon seleccionado en confirmedPkId
                };
                console.log('ID y stats del Pokémon seleccionado:', confirmedPkId);
                confirmButton.remove();
                pkLoadConfirmed = true; // Marcar que la imagen y los datos están confirmados
                await generateSidePks(selectedClone); //Pasa a generateSidePks
                // Agregar la ID al registro de Pokémon seleccionados
                selectedPokemonIds.push(pkId);
            } else {
                console.log('Ya has confirmado un Pokémon. No puedes seleccionar otro.');
            }
        });

        // Limpiar el minigameContainer antes de añadir el nuevo participante
        minigameContainer.innerHTML = '';    
        minigameContainer.appendChild(contestText); // Agrega el texto de concurso de SpAttack
        minigameContainer.appendChild(selectedClone); // Añade el clon del Pokémon seleccionado al minigameContainer
        minigameContainer.appendChild(confirmButton); // Añade el botón de confirmar al minigameContainer
    }

// Función asincrónica para generar los Pokémon laterales sin repetirse
async function generateSidePks(centerImg) {
    minigameContainer.innerHTML = '';

    const selectedPkId = parseInt(centerImg.alt.trim(), 10);

    let sidePkIds = [];
    do {
        sidePkIds = [getRandomPkId(), getRandomPkId()];
    } while (sidePkIds.includes(selectedPkId) || sidePkIds[0] === sidePkIds[1]);

    const sidePkDataPromises = sidePkIds.map(pkId => getPkData(pkId));
    const sidePkData = await Promise.all(sidePkDataPromises);

    const sideImgsPromises = sidePkIds.map(pkId => loadPkImg(pkId));
    const sideImgs = await Promise.all(sideImgsPromises);

    // const sidecentercontainer = document.createElement('div');
    // sidecentercontainer.classList.add('side-center');

    // Función para gestionar la transición de opacidad
    const fadeInImage = (img) => {
        img.style.opacity = '0';
        minigameContainer.appendChild(img);
        setTimeout(() => {
            img.style.opacity = '1';
        }, 100); // Ajusta el tiempo según necesites
    };

    // Mostrar la primera imagen lateral con transición de opacidad
    fadeInImage(sideImgs[0]);
    console.log('Stats del Pokémon izquierdo:', sidePkData[0]);

    // Mostrar la imagen central con la misma transición de opacidad
    fadeInImage(centerImg.cloneNode(true));

    // Mostrar la segunda imagen lateral con transición de opacidad
    fadeInImage(sideImgs[1]);
    console.log('Stats del Pokémon derecho:', sidePkData[1]);

    // minigameContainer.appendChild(sidecentercontainer);

// Crear botón "Comenzar batalla"
let startBattleIcon = null;

// Añadir el botón "Comenzar batalla" con un delay de 3 segundos

    startBattleIcon = document.createElement('img');
    startBattleIcon.classList.add('start-battle-icon', 'special-img'); // Añadir clase 'special-img'
    startBattleIcon.style.display = 'block'; // Mostrar el botón
    startBattleIcon.src = 'images/battleIcon.png'; // Ruta a la imagen
    startBattleIcon.alt = 'Start Battle Icon';

    startBattleIcon.addEventListener('click', () => {
        clickSound.currentTime = 0;
        clickSound.volume = soundVolumeControl.value;
        clickSound.play(); 
      startBattleIcon.remove(); // Remover la imagen al iniciar la batalla
    startBattle();
    });

    minigameContainer.appendChild(startBattleIcon);

    // Activar la transición estableciendo la opacidad a 1 después de un breve retardo
    setTimeout(() => {
    startBattleIcon.style.opacity = '1';
    }, 500); // Un pequeño retardo para asegurar que la transición funcione bien
}
// Función para esperar la selección del participante
function waitForSelection() {
    return new Promise((resolve) => {
        const boxesbarImages = document.querySelectorAll('#boxes-bar img');
        boxesbarImages.forEach(img => {
            img.addEventListener('click', () => {
                if (!pkLoadConfirmed) {
                    addSelectedParticipant(img); // Añade el participante seleccionado al minigame-container solo si no se ha confirmado otro previamente
                } else {
                    console.log('Ya has confirmado un Pokémon. No puedes seleccionar otro.');
                }
            });
        });
    });
}

////////////////////////////////////////////////////////////////////////////////////////////BATALLA

    // Función para iniciar la batalla
    function startBattle() {
        console.log('Batalla comenzada');
        
        // Reproduce el sonido de sacudida
        
        battleMusic.currentTime = 0;
        battleMusic.volume = musicVolumeControl.value;
        battleMusic.play();

        // Obtener todas las imágenes dentro de minigameContainer
        const pkImgs = document.querySelectorAll('#minigame-container img');

        // Agitar las imágenes durante 3 segundos
    pkImgs.forEach(img => {
        img.style.transition = 'transform 0.1s ease-in-out';
        img.style.animation = 'shake 0.5s ease-in-out 5'; // Agregar clase de animación para agitar
    });

    // Esperar a que la animación termine y ejecutar el código adicional
    pkImgs[0].addEventListener('animationend', async () => {
        // Aquí empieza el nuevo código agregado después de la animación
        // Aplicar grayscale a las imágenes individuales según los resultados individuales
        const pkStats = [];
        pkStats.push(await getPkData(parseInt(pkImgs[0].alt.replace('Pk ', ''), 10)));
        pkStats.push(confirmedPkId.stats);
        pkStats.push(await getPkData(parseInt(pkImgs[2].alt.replace('Pk ', ''), 10)));

        console.log('SpAttack del Pokémon Izquierda:', pkStats[0].spattack);
        console.log('SpAttack del Pokémon Centro:', pkStats[1].spattack);
        console.log('SpAttack del Pokémon Derecha:', pkStats[2].spattack);

        // Determinar el resultado de cada Pokémon individualmente
        const results = [
            pkStats[0].spattack > pkStats[1].spattack && pkStats[0].spattack > pkStats[2].spattack ? 'win' : 'lose', // Pokémon izquierda
            pkStats[1].spattack > pkStats[0].spattack && pkStats[1].spattack > pkStats[2].spattack ? 'win' : 'lose', // Pokémon centro
            pkStats[2].spattack > pkStats[0].spattack && pkStats[2].spattack > pkStats[1].spattack ? 'win' : 'lose'  // Pokémon derecha
        ];
// Determinar si hay empates y su tipo (ganando, perdiendo o empate con tie-win o tie-lose)
if (pkStats[0].spattack === pkStats[1].spattack) {              //SI IZQUIERDA Y CENTRO EMPATAN

    if (pkStats[0].spattack > pkStats[2].spattack) {               //e izquierda > derecha
        results[0] = 'tie-win';                             //izquierda empata ganando
        results[1] = 'tie-win';                             //centro empata ganando
        results[2] = 'lose';                                //derecha pierde       
    } else if (pkStats[0].spattack < pkStats[2].spattack) {        //e izquierda < derecha
        results[0] = 'tie-lose';                            //izquierda empata perdiendo
        results[1] = 'tie-lose';                            //centro empata perdiendo 
        results[2] = 'win';                                 //derecha gana  
    }


} else if (pkStats[0].spattack === pkStats[2].spattack) {       //SI IZQUIERDA Y DERECHA EMPATAN
    
    if (pkStats[0].spattack > pkStats[1].spattack) {               //e izquierda > centro
        results[0] = 'tie-win';                            //izquierda empata ganando
        results[1] = 'lose';                               //centro pierde
        results[2] = 'tie-win';                            //derecha empata ganando  
    } else if (pkStats[0].spattack < pkStats[1].spattack) {        //e izquierda < centro
        results[0] = 'tie-lose';                            //izquierda empata perdiendo
        results[1] = 'win';                                 //centro gana
        results[2] = 'tie-lose';                            //derecha empata perdiendo   
    }


} else if (pkStats[1].spattack === pkStats[2].spattack) {       //SI CENTRO Y DERECHA EMPATAN
    
    if (pkStats[1].spattack > pkStats[0].spattack) {               //y centro > izquierda
        results[0] = 'lose';                               //izquierda pierde    
        results[1] = 'tie-win';                            //centro empata ganando
        results[2] = 'tie-win';                            //derecha empata ganando
    } else if (pkStats[1].spattack < pkStats[0].spattack) {        //y centro < izquierda
        results[0] = 'win';                               //izquierda gana 
        results[1] = 'tie-lose';                            //centro empata perdiendo
        results[2] = 'tie-lose';                            //derecha empata perdiendo
    }


} else if (pkStats[0].spattack === pkStats[1].spattack && pkStats[0].spattack === pkStats[2].spattack) {     //SI LOS 3 EMPATAN
        results[0] = 'tie-win';                             //izquierda empata ganando
        results[1] = 'tie-win';                             //centro empata ganando
        results[2] = 'tie-win';                                //derecha pierde       
    }



    // Determinar el resultado final basado en el resultado del Pokémon Centro
    let finalResult;
    if (results[1] === 'win') {
        finalResult = 'Victory!';
    } else if (results[1] === 'lose') {
        finalResult = 'Lose!';
    } else if (results[1] === 'tie-win') {
        finalResult = 'Tie!';
    } else if (results[1] === 'tie-lose') {
        finalResult = 'Lose!';
    }

    // Almacenar el resultado en la variable global
    resultsStorage.push(finalResult);

        // Mostrar resultados individuales de cada Pokémon y resultado final
        console.log(`Resultado del Pokémon Izquierda: ${results[0]}`);
        console.log(`Resultado del Pokémon Centro: ${results[1]}`);
        console.log(`Resultado del Pokémon Derecha: ${results[2]}`);
        console.log(`Resultado Final: ${finalResult}`);

// Datos de configuración para los contenedores y elementos
const containerClasses = ['result-container', 'result-container2', 'result-container3'];
const elementClasses = ['result-text', 'result-text2', 'result-text3'];

// Crear y agregar los contenedores principales y elementos de resultado
containerClasses.forEach((containerClass, index) => {
    const resultContainer = document.createElement('div');
    resultContainer.className = containerClass;

    const resultElement = document.createElement('div');
    resultElement.className = elementClasses[index];
    resultElement.innerHTML = `${pkStats[index].hp}`;
    resultContainer.appendChild(resultElement);

    document.getElementById('minigame-container').appendChild(resultContainer);
});

 // Aplicar efectos visuales a las imágenes según los resultados
 pkImgs.forEach((img, index) => {
    if (index === 1) { // Pokémon centro
        if (results[1] === 'lose' || results[1] === 'tie-lose') {
            img.style.filter = 'grayscale(100%)'; // Convertir a escala de grises si pierde
        }
    } else { // Pokémon izquierda y derecha (0 y 2)
        if (results[index] === 'lose' || results[index] === 'tie-lose') {
            img.style.filter = 'grayscale(100%)'; // Convertir a escala de grises si pierde
        }
    }
});
    
// Obtener el ID del Pokémon central seleccionado
const selectedPkId = confirmedPkId.id;

// Encontrar el box que contiene la imagen correcta
const selectedBox = Array.from(boxesbarContainer.children).find(box => {
    // Buscar la imagen dentro del box que tenga las clases y el ID correcto
    const img = box.querySelector('.loaded.PkImgInBox');
    if (img && img.alt === selectedPkId) {
        return true;
    }
    return false;
});

if (selectedBox) {
    let borderColor = '';
    let backgroundimage = '';

    if (finalResult === 'Victory!') {
        borderColor = '#71d15d';  // Color verde para victoria
 
    } else if (finalResult === 'Lose!') {
        borderColor = '#d15d5d';    // Color rojo para derrota
 
    } else if (finalResult === 'Tie!') {
        borderColor = 'yellow'; // Color amarillo para empate
 
    }

    if (borderColor) {
        selectedBox.style.borderColor = borderColor;
    } else {
        console.error('Resultado final desconocido:', finalResult);
    }

    // Crear el botón "Continuar"
    const continueButton = document.createElement('button');
    continueButton.classList.add('continue-button');
    continueButton.style.display = 'block';
    continueButton.innerText = 'Continue...';

    continueButton.addEventListener('click', () => {
        clickSound.currentTime = 0;
        clickSound.volume = soundVolumeControl.value;
        clickSound.play(); 
        continueButton.remove(); // Eliminar el botón al iniciar la fase SpAttack
        minigameContainer.innerHTML = '';                           //Limpia el minigameContainer
        pkLoadConfirmed = false; // Marcar que la imagen y los datos están confirmados
        console.log(resultsStorage)
        contestPhaseSpDefense();
    });

    // Añadir el botón "Continuar" al contenedor del minijuego
    document.getElementById('minigame-container').appendChild(continueButton);



} else {
    console.error('No se encontró la caja seleccionada.');
}

    });
}
    // Espera a que se seleccione un participante
    waitForSelection();

    console.log('Contest Phase spattack ended');

} //termina contest spattack

                                                                            // SPDEFENSE CONTEST
function contestPhaseSpDefense() {
    console.log('Contest Phase SpDefense started');
    console.log(selectedPokemonIds)
    // Muestra el texto en el container
    const contestText = document.createElement('div');
    contestText.classList.add('contest-text');
    contestText.innerHTML = 'SP. DEFENSE CONTEST! <br> Choose the Pokémon to participate!';
    minigameContainer.appendChild(contestText);
    contestText.offsetWidth;
    contestText.classList.add('show');
    let selectedClone = null;
    let confirmButton = null;


    // Función para agregar el participante seleccionado al minigame-container
    async function addSelectedParticipant(img) {
        if (selectedClone) {
            selectedClone.remove(); // Elimina el Pokémon seleccionado previamente si existe
        }
        if (confirmButton) {
            confirmButton.remove(); // Elimina el botón de confirmar si existe
        }

        const pkId = img.alt.trim(); // Obtener la ID de los Pokémon seleccionado y eliminar espacios en blanco alrededor
        if (selectedPokemonIds.includes(pkId)) {
            console.log('Este Pokémon ya ha sido seleccionado en la fase anterior. No puedes elegirlo de nuevo.');
            return;
        }
        const formattedPkId = parseInt(pkId); // Obtener el número de la ID del Pokémon
        const pkData = await getPkData(formattedPkId); // Obtener los stats del Pokémon usando la función getPkData

        selectedClone = img.cloneNode(true); // Clona la imagen seleccionada
        selectedClone.style.opacity = '1';
        selectedClone.classList.add('PkImgInBox');

        // Crear botón de confirmar
        confirmButton = document.createElement('button');
        confirmButton.classList.add('confirm-button');
        confirmButton.style.display = 'block';
        confirmButton.innerText = 'CONFIRM';
        // Evento de clic en el botón de confirmar
        confirmButton.addEventListener('click', async () => {
            clickSound.currentTime = 0;
            clickSound.volume = soundVolumeControl.value;
            clickSound.play(); 
            if (!pkLoadConfirmed) {
                confirmedPkId = {
                    id: pkId,
                    stats: pkData // Guardar la ID y los stats del Pokémon seleccionado en confirmedPkId
                };
                console.log('ID y stats del Pokémon seleccionado:', confirmedPkId);
                confirmButton.remove();
                pkLoadConfirmed = true; // Marcar que la imagen y los datos están confirmados
                await generateSidePks(selectedClone); //Pasa a generateSidePks
                // Agregar la ID al registro de Pokémon seleccionados
                selectedPokemonIds.push(pkId);
            } else {
                console.log('Ya has confirmado un Pokémon. No puedes seleccionar otro.');
            }
        });

        // Limpiar el minigameContainer antes de añadir el nuevo participante
        minigameContainer.innerHTML = '';    
        minigameContainer.appendChild(contestText); // Agrega el texto de concurso de SpDefense
        minigameContainer.appendChild(selectedClone); // Añade el clon del Pokémon seleccionado al minigameContainer
        minigameContainer.appendChild(confirmButton); // Añade el botón de confirmar al minigameContainer
    }

// Función asincrónica para generar los Pokémon laterales sin repetirse
async function generateSidePks(centerImg) {
    minigameContainer.innerHTML = '';

    const selectedPkId = parseInt(centerImg.alt.trim(), 10);

    let sidePkIds = [];
    do {
        sidePkIds = [getRandomPkId(), getRandomPkId()];
    } while (sidePkIds.includes(selectedPkId) || sidePkIds[0] === sidePkIds[1]);

    const sidePkDataPromises = sidePkIds.map(pkId => getPkData(pkId));
    const sidePkData = await Promise.all(sidePkDataPromises);

    const sideImgsPromises = sidePkIds.map(pkId => loadPkImg(pkId));
    const sideImgs = await Promise.all(sideImgsPromises);

    // const sidecentercontainer = document.createElement('div');
    // sidecentercontainer.classList.add('side-center');

    // Función para gestionar la transición de opacidad
    const fadeInImage = (img) => {
        img.style.opacity = '0';
        minigameContainer.appendChild(img);
        setTimeout(() => {
            img.style.opacity = '1';
        }, 100); // Ajusta el tiempo según necesites
    };

    // Mostrar la primera imagen lateral con transición de opacidad
    fadeInImage(sideImgs[0]);
    console.log('Stats del Pokémon izquierdo:', sidePkData[0]);

    // Mostrar la imagen central con la misma transición de opacidad
    fadeInImage(centerImg.cloneNode(true));

    // Mostrar la segunda imagen lateral con transición de opacidad
    fadeInImage(sideImgs[1]);
    console.log('Stats del Pokémon derecho:', sidePkData[1]);

    // minigameContainer.appendChild(sidecentercontainer);

// Crear botón "Comenzar batalla"
let startBattleIcon = null;

// Añadir el botón "Comenzar batalla" con un delay de 3 segundos

    startBattleIcon = document.createElement('img');
    startBattleIcon.classList.add('start-battle-icon', 'special-img'); // Añadir clase 'special-img'
    startBattleIcon.style.display = 'block'; // Mostrar el botón
    startBattleIcon.src = 'images/battleIcon.png'; // Ruta a la imagen
    startBattleIcon.alt = 'Start Battle Icon';

    startBattleIcon.addEventListener('click', () => {
        clickSound.currentTime = 0;
        clickSound.volume = soundVolumeControl.value;
        clickSound.play(); 
      startBattleIcon.remove(); // Remover la imagen al iniciar la batalla
    startBattle();
    });

    minigameContainer.appendChild(startBattleIcon);

    // Activar la transición estableciendo la opacidad a 1 después de un breve retardo
    setTimeout(() => {
    startBattleIcon.style.opacity = '1';
    }, 500); // Un pequeño retardo para asegurar que la transición funcione bien
}

// Función para esperar la selección del participante
function waitForSelection() {
    return new Promise((resolve) => {
        const boxesbarImages = document.querySelectorAll('#boxes-bar img');
        boxesbarImages.forEach(img => {
            img.addEventListener('click', () => {
                if (!pkLoadConfirmed) {
                    addSelectedParticipant(img); // Añade el participante seleccionado al minigame-container solo si no se ha confirmado otro previamente
                } else {
                    console.log('Ya has confirmado un Pokémon. No puedes seleccionar otro.');
                }
            });
        });
    });
}

////////////////////////////////////////////////////////////////////////////////////////////BATALLA

    // Función para iniciar la batalla
    function startBattle() {
        console.log('Batalla comenzada');
        
        // Reproduce el sonido de sacudida
        
        battleMusic.currentTime = 0;
        battleMusic.volume = musicVolumeControl.value;
        battleMusic.play();

        // Obtener todas las imágenes dentro de minigameContainer
        const pkImgs = document.querySelectorAll('#minigame-container img');

        // Agitar las imágenes durante 3 segundos
    pkImgs.forEach(img => {
        img.style.transition = 'transform 0.1s ease-in-out';
        img.style.animation = 'shake 0.5s ease-in-out 5'; // Agregar clase de animación para agitar
    });

    // Esperar a que la animación termine y ejecutar el código adicional
    pkImgs[0].addEventListener('animationend', async () => {
        // Aquí empieza el nuevo código agregado después de la animación
        // Aplicar grayscale a las imágenes individuales según los resultados individuales
        const pkStats = [];
        pkStats.push(await getPkData(parseInt(pkImgs[0].alt.replace('Pk ', ''), 10)));
        pkStats.push(confirmedPkId.stats);
        pkStats.push(await getPkData(parseInt(pkImgs[2].alt.replace('Pk ', ''), 10)));

        console.log('SpDefense del Pokémon Izquierda:', pkStats[0].spdefense);
        console.log('SpDefense del Pokémon Centro:', pkStats[1].spdefense);
        console.log('SpDefense del Pokémon Derecha:', pkStats[2].spdefense);

        // Determinar el resultado de cada Pokémon individualmente
        const results = [
            pkStats[0].spdefense > pkStats[1].spdefense && pkStats[0].spdefense > pkStats[2].spdefense ? 'win' : 'lose', // Pokémon izquierda
            pkStats[1].spdefense > pkStats[0].spdefense && pkStats[1].spdefense > pkStats[2].spdefense ? 'win' : 'lose', // Pokémon centro
            pkStats[2].spdefense > pkStats[0].spdefense && pkStats[2].spdefense > pkStats[1].spdefense ? 'win' : 'lose'  // Pokémon derecha
        ];
// Determinar si hay empates y su tipo (ganando, perdiendo o empate con tie-win o tie-lose)
if (pkStats[0].spdefense === pkStats[1].spdefense) {              //SI IZQUIERDA Y CENTRO EMPATAN

    if (pkStats[0].spdefense > pkStats[2].spdefense) {               //e izquierda > derecha
        results[0] = 'tie-win';                             //izquierda empata ganando
        results[1] = 'tie-win';                             //centro empata ganando
        results[2] = 'lose';                                //derecha pierde       
    } else if (pkStats[0].spdefense < pkStats[2].spdefense) {        //e izquierda < derecha
        results[0] = 'tie-lose';                            //izquierda empata perdiendo
        results[1] = 'tie-lose';                            //centro empata perdiendo 
        results[2] = 'win';                                 //derecha gana  
    }


} else if (pkStats[0].spdefense === pkStats[2].spdefense) {       //SI IZQUIERDA Y DERECHA EMPATAN
    
    if (pkStats[0].spdefense > pkStats[1].spdefense) {               //e izquierda > centro
        results[0] = 'tie-win';                            //izquierda empata ganando
        results[1] = 'lose';                               //centro pierde
        results[2] = 'tie-win';                            //derecha empata ganando  
    } else if (pkStats[0].spdefense < pkStats[1].spdefense) {        //e izquierda < centro
        results[0] = 'tie-lose';                            //izquierda empata perdiendo
        results[1] = 'win';                                 //centro gana
        results[2] = 'tie-lose';                            //derecha empata perdiendo   
    }


} else if (pkStats[1].spdefense === pkStats[2].spdefense) {       //SI CENTRO Y DERECHA EMPATAN
    
    if (pkStats[1].spdefense > pkStats[0].spdefense) {               //y centro > izquierda
        results[0] = 'lose';                               //izquierda pierde    
        results[1] = 'tie-win';                            //centro empata ganando
        results[2] = 'tie-win';                            //derecha empata ganando
    } else if (pkStats[1].spdefense < pkStats[0].spdefense) {        //y centro < izquierda
        results[0] = 'win';                               //izquierda gana 
        results[1] = 'tie-lose';                            //centro empata perdiendo
        results[2] = 'tie-lose';                            //derecha empata perdiendo
    }


} else if (pkStats[0].spdefense === pkStats[1].spdefense && pkStats[0].spdefense === pkStats[2].spdefense) {     //SI LOS 3 EMPATAN
        results[0] = 'tie-win';                             //izquierda empata ganando
        results[1] = 'tie-win';                             //centro empata ganando
        results[2] = 'tie-win';                                //derecha pierde       
    }



    // Determinar el resultado final basado en el resultado del Pokémon Centro
    let finalResult;
    if (results[1] === 'win') {
        finalResult = 'Victory!';
    } else if (results[1] === 'lose') {
        finalResult = 'Lose!';
    } else if (results[1] === 'tie-win') {
        finalResult = 'Tie!';
    } else if (results[1] === 'tie-lose') {
        finalResult = 'Lose!';
    }

    // Almacenar el resultado en la variable global
    resultsStorage.push(finalResult);

        // Mostrar resultados individuales de cada Pokémon y resultado final
        console.log(`Resultado del Pokémon Izquierda: ${results[0]}`);
        console.log(`Resultado del Pokémon Centro: ${results[1]}`);
        console.log(`Resultado del Pokémon Derecha: ${results[2]}`);
        console.log(`Resultado Final: ${finalResult}`);

// Datos de configuración para los contenedores y elementos
const containerClasses = ['result-container', 'result-container2', 'result-container3'];
const elementClasses = ['result-text', 'result-text2', 'result-text3'];

// Crear y agregar los contenedores principales y elementos de resultado
containerClasses.forEach((containerClass, index) => {
    const resultContainer = document.createElement('div');
    resultContainer.className = containerClass;

    const resultElement = document.createElement('div');
    resultElement.className = elementClasses[index];
    resultElement.innerHTML = `${pkStats[index].hp}`;
    resultContainer.appendChild(resultElement);

    document.getElementById('minigame-container').appendChild(resultContainer);
});


 // Aplicar efectos visuales a las imágenes según los resultados
 pkImgs.forEach((img, index) => {
    if (index === 1) { // Pokémon centro
        if (results[1] === 'lose' || results[1] === 'tie-lose') {
            img.style.filter = 'grayscale(100%)'; // Convertir a escala de grises si pierde
        }
    } else { // Pokémon izquierda y derecha (0 y 2)
        if (results[index] === 'lose' || results[index] === 'tie-lose') {
            img.style.filter = 'grayscale(100%)'; // Convertir a escala de grises si pierde
        }
    }
});
    
// Obtener el ID del Pokémon central seleccionado
const selectedPkId = confirmedPkId.id;

// Encontrar el box que contiene la imagen correcta
const selectedBox = Array.from(boxesbarContainer.children).find(box => {
    // Buscar la imagen dentro del box que tenga las clases y el ID correcto
    const img = box.querySelector('.loaded.PkImgInBox');
    if (img && img.alt === selectedPkId) {
        return true;
    }
    return false;
});

if (selectedBox) {
    let borderColor = '';
    let backgroundimage = '';

    if (finalResult === 'Victory!') {
        borderColor = '#71d15d';  // Color verde para victoria
 
    } else if (finalResult === 'Lose!') {
        borderColor = '#d15d5d';    // Color rojo para derrota
 
    } else if (finalResult === 'Tie!') {
        borderColor = 'yellow'; // Color amarillo para empate
 
    }

    if (borderColor) {
        selectedBox.style.borderColor = borderColor;
    } else {
        console.error('Resultado final desconocido:', finalResult);
    }

    // Crear el botón "Continuar"
    const continueButton = document.createElement('button');
    continueButton.classList.add('continue-button');
    continueButton.style.display = 'block';
    continueButton.innerText = 'Continue...';

    continueButton.addEventListener('click', () => {
        clickSound.currentTime = 0;
        clickSound.volume = soundVolumeControl.value;
        clickSound.play(); 
        continueButton.remove(); // Eliminar el botón al iniciar la fase SpDefense
        minigameContainer.innerHTML = '';                           //Limpia el minigameContainer
        pkLoadConfirmed = false; // Marcar que la imagen y los datos están confirmados
        console.log(resultsStorage)
        contestPhaseSpeed();
    });

    // Añadir el botón "Continuar" al contenedor del minijuego
    document.getElementById('minigame-container').appendChild(continueButton);



} else {
    console.error('No se encontró la caja seleccionada.');
}

    });
}
    // Espera a que se seleccione un participante
    waitForSelection();

    console.log('Contest Phase spdefense ended');

} //termina contest spdefense

                                                                            // SPEED CONTEST
function contestPhaseSpeed() {
    console.log('Contest Phase Speed started');
    console.log(selectedPokemonIds)
    // Muestra el texto en el container
    const contestText = document.createElement('div');
    contestText.classList.add('contest-text');
    contestText.innerHTML = 'SPEED CONTEST! <br> Choose the Pokémon to participate!';
    minigameContainer.appendChild(contestText);
    contestText.offsetWidth;
    contestText.classList.add('show');
    let selectedClone = null;
    let confirmButton = null;


    // Función para agregar el participante seleccionado al minigame-container
    async function addSelectedParticipant(img) {
        if (selectedClone) {
            selectedClone.remove(); // Elimina el Pokémon seleccionado previamente si existe
        }
        if (confirmButton) {
            confirmButton.remove(); // Elimina el botón de confirmar si existe
        }

        const pkId = img.alt.trim(); // Obtener la ID de los Pokémon seleccionado y eliminar espacios en blanco alrededor
        if (selectedPokemonIds.includes(pkId)) {
            console.log('Este Pokémon ya ha sido seleccionado en la fase anterior. No puedes elegirlo de nuevo.');
            return;
        }
        const formattedPkId = parseInt(pkId); // Obtener el número de la ID del Pokémon
        const pkData = await getPkData(formattedPkId); // Obtener los stats del Pokémon usando la función getPkData

        selectedClone = img.cloneNode(true); // Clona la imagen seleccionada
        selectedClone.style.opacity = '1';
        selectedClone.classList.add('PkImgInBox');

        // Crear botón de confirmar
        confirmButton = document.createElement('button');
        confirmButton.classList.add('confirm-button');
        confirmButton.style.display = 'block';
        confirmButton.innerText = 'CONFIRM';
        // Evento de clic en el botón de confirmar
        confirmButton.addEventListener('click', async () => {
            clickSound.currentTime = 0;
            clickSound.volume = soundVolumeControl.value;
            clickSound.play(); 
            if (!pkLoadConfirmed) {
                confirmedPkId = {
                    id: pkId,
                    stats: pkData // Guardar la ID y los stats del Pokémon seleccionado en confirmedPkId
                };
                console.log('ID y stats del Pokémon seleccionado:', confirmedPkId);
                confirmButton.remove();
                pkLoadConfirmed = true; // Marcar que la imagen y los datos están confirmados
                await generateSidePks(selectedClone); //Pasa a generateSidePks
                // Agregar la ID al registro de Pokémon seleccionados
                selectedPokemonIds.push(pkId);
            } else {
                console.log('Ya has confirmado un Pokémon. No puedes seleccionar otro.');
            }
        });

        // Limpiar el minigameContainer antes de añadir el nuevo participante
        minigameContainer.innerHTML = '';    
        minigameContainer.appendChild(contestText); // Agrega el texto de concurso de Speed
        minigameContainer.appendChild(selectedClone); // Añade el clon del Pokémon seleccionado al minigameContainer
        minigameContainer.appendChild(confirmButton); // Añade el botón de confirmar al minigameContainer
    }

// Función asincrónica para generar los Pokémon laterales sin repetirse
async function generateSidePks(centerImg) {
    minigameContainer.innerHTML = '';

    const selectedPkId = parseInt(centerImg.alt.trim(), 10);

    let sidePkIds = [];
    do {
        sidePkIds = [getRandomPkId(), getRandomPkId()];
    } while (sidePkIds.includes(selectedPkId) || sidePkIds[0] === sidePkIds[1]);

    const sidePkDataPromises = sidePkIds.map(pkId => getPkData(pkId));
    const sidePkData = await Promise.all(sidePkDataPromises);

    const sideImgsPromises = sidePkIds.map(pkId => loadPkImg(pkId));
    const sideImgs = await Promise.all(sideImgsPromises);

    // const sidecentercontainer = document.createElement('div');
    // sidecentercontainer.classList.add('side-center');

    // Función para gestionar la transición de opacidad
    const fadeInImage = (img) => {
        img.style.opacity = '0';
        minigameContainer.appendChild(img);
        setTimeout(() => {
            img.style.opacity = '1';
        }, 100); // Ajusta el tiempo según necesites
    };

    // Mostrar la primera imagen lateral con transición de opacidad
    fadeInImage(sideImgs[0]);
    console.log('Stats del Pokémon izquierdo:', sidePkData[0]);

    // Mostrar la imagen central con la misma transición de opacidad
    fadeInImage(centerImg.cloneNode(true));

    // Mostrar la segunda imagen lateral con transición de opacidad
    fadeInImage(sideImgs[1]);
    console.log('Stats del Pokémon derecho:', sidePkData[1]);

    // minigameContainer.appendChild(sidecentercontainer);

// Crear botón "Comenzar batalla"
let startBattleIcon = null;

// Añadir el botón "Comenzar batalla" con un delay de 3 segundos

    startBattleIcon = document.createElement('img');
    startBattleIcon.classList.add('start-battle-icon', 'special-img'); // Añadir clase 'special-img'
    startBattleIcon.style.display = 'block'; // Mostrar el botón
    startBattleIcon.src = 'images/battleIcon.png'; // Ruta a la imagen
    startBattleIcon.alt = 'Start Battle Icon';

    startBattleIcon.addEventListener('click', () => {
        clickSound.currentTime = 0;
        clickSound.volume = soundVolumeControl.value;
        clickSound.play(); 
      startBattleIcon.remove(); // Remover la imagen al iniciar la batalla
    startBattle();
    });

    minigameContainer.appendChild(startBattleIcon);

    // Activar la transición estableciendo la opacidad a 1 después de un breve retardo
    setTimeout(() => {
    startBattleIcon.style.opacity = '1';
    }, 500); // Un pequeño retardo para asegurar que la transición funcione bien
}

// Función para esperar la selección del participante
function waitForSelection() {
    return new Promise((resolve) => {
        const boxesbarImages = document.querySelectorAll('#boxes-bar img');
        boxesbarImages.forEach(img => {
            img.addEventListener('click', () => {
                if (!pkLoadConfirmed) {
                    addSelectedParticipant(img); // Añade el participante seleccionado al minigame-container solo si no se ha confirmado otro previamente
                } else {
                    console.log('Ya has confirmado un Pokémon. No puedes seleccionar otro.');
                }
            });
        });
    });
}

////////////////////////////////////////////////////////////////////////////////////////////BATALLA

    // Función para iniciar la batalla
    function startBattle() {
        console.log('Batalla comenzada');
        
        // Reproduce el sonido de sacudida
        
        battleMusic.currentTime = 0;
        battleMusic.volume = musicVolumeControl.value;
        battleMusic.play();

        // Obtener todas las imágenes dentro de minigameContainer
        const pkImgs = document.querySelectorAll('#minigame-container img');

        // Agitar las imágenes durante 3 segundos
    pkImgs.forEach(img => {
        img.style.transition = 'transform 0.1s ease-in-out';
        img.style.animation = 'shake 0.5s ease-in-out 5'; // Agregar clase de animación para agitar
    });

    // Esperar a que la animación termine y ejecutar el código adicional
    pkImgs[0].addEventListener('animationend', async () => {
        // Aquí empieza el nuevo código agregado después de la animación
        // Aplicar grayscale a las imágenes individuales según los resultados individuales
        const pkStats = [];
        pkStats.push(await getPkData(parseInt(pkImgs[0].alt.replace('Pk ', ''), 10)));
        pkStats.push(confirmedPkId.stats);
        pkStats.push(await getPkData(parseInt(pkImgs[2].alt.replace('Pk ', ''), 10)));

        console.log('Speed del Pokémon Izquierda:', pkStats[0].speed);
        console.log('Speed del Pokémon Centro:', pkStats[1].speed);
        console.log('Speed del Pokémon Derecha:', pkStats[2].speed);

        // Determinar el resultado de cada Pokémon individualmente
        const results = [
            pkStats[0].speed > pkStats[1].speed && pkStats[0].speed > pkStats[2].speed ? 'win' : 'lose', // Pokémon izquierda
            pkStats[1].speed > pkStats[0].speed && pkStats[1].speed > pkStats[2].speed ? 'win' : 'lose', // Pokémon centro
            pkStats[2].speed > pkStats[0].speed && pkStats[2].speed > pkStats[1].speed ? 'win' : 'lose'  // Pokémon derecha
        ];
// Determinar si hay empates y su tipo (ganando, perdiendo o empate con tie-win o tie-lose)
if (pkStats[0].speed === pkStats[1].speed) {              //SI IZQUIERDA Y CENTRO EMPATAN

    if (pkStats[0].speed > pkStats[2].speed) {               //e izquierda > derecha
        results[0] = 'tie-win';                             //izquierda empata ganando
        results[1] = 'tie-win';                             //centro empata ganando
        results[2] = 'lose';                                //derecha pierde       
    } else if (pkStats[0].speed < pkStats[2].speed) {        //e izquierda < derecha
        results[0] = 'tie-lose';                            //izquierda empata perdiendo
        results[1] = 'tie-lose';                            //centro empata perdiendo 
        results[2] = 'win';                                 //derecha gana  
    }


} else if (pkStats[0].speed === pkStats[2].speed) {       //SI IZQUIERDA Y DERECHA EMPATAN
    
    if (pkStats[0].speed > pkStats[1].speed) {               //e izquierda > centro
        results[0] = 'tie-win';                            //izquierda empata ganando
        results[1] = 'lose';                               //centro pierde
        results[2] = 'tie-win';                            //derecha empata ganando  
    } else if (pkStats[0].speed < pkStats[1].speed) {        //e izquierda < centro
        results[0] = 'tie-lose';                            //izquierda empata perdiendo
        results[1] = 'win';                                 //centro gana
        results[2] = 'tie-lose';                            //derecha empata perdiendo   
    }


} else if (pkStats[1].speed === pkStats[2].speed) {       //SI CENTRO Y DERECHA EMPATAN
    
    if (pkStats[1].speed > pkStats[0].speed) {               //y centro > izquierda
        results[0] = 'lose';                               //izquierda pierde    
        results[1] = 'tie-win';                            //centro empata ganando
        results[2] = 'tie-win';                            //derecha empata ganando
    } else if (pkStats[1].speed < pkStats[0].speed) {        //y centro < izquierda
        results[0] = 'win';                               //izquierda gana 
        results[1] = 'tie-lose';                            //centro empata perdiendo
        results[2] = 'tie-lose';                            //derecha empata perdiendo
    }


} else if (pkStats[0].speed === pkStats[1].speed && pkStats[0].speed === pkStats[2].speed) {     //SI LOS 3 EMPATAN
        results[0] = 'tie-win';                             //izquierda empata ganando
        results[1] = 'tie-win';                             //centro empata ganando
        results[2] = 'tie-win';                                //derecha pierde       
    }



    // Determinar el resultado final basado en el resultado del Pokémon Centro
    let finalResult;
    if (results[1] === 'win') {
        finalResult = 'Victory!';
    } else if (results[1] === 'lose') {
        finalResult = 'Lose!';
    } else if (results[1] === 'tie-win') {
        finalResult = 'Tie!';
    } else if (results[1] === 'tie-lose') {
        finalResult = 'Lose!';
    }

    // Almacenar el resultado en la variable global
    resultsStorage.push(finalResult);

        // Mostrar resultados individuales de cada Pokémon y resultado final
        console.log(`Resultado del Pokémon Izquierda: ${results[0]}`);
        console.log(`Resultado del Pokémon Centro: ${results[1]}`);
        console.log(`Resultado del Pokémon Derecha: ${results[2]}`);
        console.log(`Resultado Final: ${finalResult}`);

// Datos de configuración para los contenedores y elementos
const containerClasses = ['result-container', 'result-container2', 'result-container3'];
const elementClasses = ['result-text', 'result-text2', 'result-text3'];

// Crear y agregar los contenedores principales y elementos de resultado
containerClasses.forEach((containerClass, index) => {
    const resultContainer = document.createElement('div');
    resultContainer.className = containerClass;

    const resultElement = document.createElement('div');
    resultElement.className = elementClasses[index];
    resultElement.innerHTML = `${pkStats[index].hp}`;
    resultContainer.appendChild(resultElement);

    document.getElementById('minigame-container').appendChild(resultContainer);
});


 // Aplicar efectos visuales a las imágenes según los resultados
 pkImgs.forEach((img, index) => {
    if (index === 1) { // Pokémon centro
        if (results[1] === 'lose' || results[1] === 'tie-lose') {
            img.style.filter = 'grayscale(100%)'; // Convertir a escala de grises si pierde
        }
    } else { // Pokémon izquierda y derecha (0 y 2)
        if (results[index] === 'lose' || results[index] === 'tie-lose') {
            img.style.filter = 'grayscale(100%)'; // Convertir a escala de grises si pierde
        }
    }
});
    
// Obtener el ID del Pokémon central seleccionado
const selectedPkId = confirmedPkId.id;

// Encontrar el box que contiene la imagen correcta
const selectedBox = Array.from(boxesbarContainer.children).find(box => {
    // Buscar la imagen dentro del box que tenga las clases y el ID correcto
    const img = box.querySelector('.loaded.PkImgInBox');
    if (img && img.alt === selectedPkId) {
        return true;
    }
    return false;
});

if (selectedBox) {
    let borderColor = '';
    let backgroundimage = '';

    if (finalResult === 'Victory!') {
        borderColor = '#71d15d';  // Color verde para victoria
 
    } else if (finalResult === 'Lose!') {
        borderColor = '#d15d5d';    // Color rojo para derrota
 
    } else if (finalResult === 'Tie!') {
        borderColor = 'yellow'; // Color amarillo para empate
 
    }

    if (borderColor) {
        selectedBox.style.borderColor = borderColor;
    } else {
        console.error('Resultado final desconocido:', finalResult);
    }

    // Crear el botón "Continuar"
    const continueButton = document.createElement('button');
    continueButton.classList.add('grade-button');
    continueButton.style.display = 'block';
    continueButton.innerText = 'Check final grade';

    continueButton.addEventListener('click', () => {
        clickSound.currentTime = 0;
        clickSound.volume = soundVolumeControl.value;
        clickSound.play(); 
        continueButton.remove(); // Eliminar el botón al iniciar la fase Speed
        minigameContainer.innerHTML = '';                           //Limpia el minigameContainer
        pkLoadConfirmed = false; // Marcar que la imagen y los datos están confirmados
        console.log(resultsStorage)
        gradePhase();
    });

    // Añadir el botón "Continuar" al contenedor del minijuego
    document.getElementById('minigame-container').appendChild(continueButton);



} else {
    console.error('No se encontró la caja seleccionada.');
}

    });
}
    // Espera a que se seleccione un participante
    waitForSelection();

    console.log('Contest Phase speed ended');

} //termina contest speed


function gradePhase() {
    // Inicializamos la nota en 0
    let grade = 0;

 // Recorremos el array de resultsStorage
 for (let i = 0; i < resultsStorage.length; i++) {
    // Sumamos el valor correspondiente según el resultado
    switch (resultsStorage[i]) {
        case 'Victory!':
            grade += 1;
            break;
        case 'Tie!':
            grade += 0.5;
            break;
        // No es necesario hacer nada en el caso de 'Lose!', ya que suma 0
        default:
            break;
    }
}

    // Convertimos la nota sobre 6 a una nota sobre 10
    let gradeOutOf10 = (grade / 6) * 10;

    // Redondeamos la nota a un solo decimal
    gradeOutOf10 = Math.round(gradeOutOf10 * 10) / 10;

    // Si el grado es entero, eliminamos la parte decimal
    if (Number.isInteger(gradeOutOf10)) {
        gradeOutOf10 = Math.round(gradeOutOf10); // Redondeamos de nuevo para asegurar que es entero
    }

    // Obtenemos el contenedor
    const pkContainer = document.getElementById('minigame-container');

    // Creamos un elemento para mostrar el resultado
    const resultElement = document.createElement('p');
    resultElement.textContent = `FINAL GRADE: ${gradeOutOf10}/10`;
    // Añadimos una clase para poder aplicar estilos desde CSS
    resultElement.classList.add('final-grade');

// Añadimos el elemento al contenedor
pkContainer.appendChild(resultElement);
}






    

    // Empezar el juego mostrando las 3 imágenes
    addRandomImgPk();

});

