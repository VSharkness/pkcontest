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
        return new Promise(async (resolve) => {
            const formattedPkId = pkId.toString().padStart(4, '0');
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pkId}`);
            const data = await response.json();
            const imageUrl = data.sprites.other['official-artwork'].front_default;
            
            const pkImg = new Image();
            pkImg.src = imageUrl;
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
                }, 100);
            };

            fadeInImage(sideImgs[0]);
            console.log('Left stats:', sidePkData[0]);

            fadeInImage(centerImg.cloneNode(true));
            console.log('Selected stats:', confirmedPkId);

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

        // WAIT FOR SELECTION 
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
                                resolve();
                            });
                        }
                    });
                });
            });
        }

                                                                //BATALLA

        function startBattle() {

            // FIGHT SOUND
            battleMusic.currentTime = 0;
            battleMusic.volume = musicVolumeControl.value;
            battleMusic.play();

            const pkImgs = document.querySelectorAll('#minigame-container img');

            // SHAKE IMGS
            pkImgs.forEach(img => {
            img.style.transition = 'transform 0.1s ease-in-out';
            img.style.animation = 'shake 0.5s ease-in-out 5';
            });

            // SHOW RESULTS
            pkImgs[0].addEventListener('animationend', async () => {
                const pkStats = [];
                pkStats.push(await getPkData(parseInt(pkImgs[0].alt.replace('Pk ', ''), 10)));
                pkStats.push(confirmedPkId.stats);
                pkStats.push(await getPkData(parseInt(pkImgs[2].alt.replace('Pk ', ''), 10)));

                const results = [
                    pkStats[0].hp > pkStats[1].hp && pkStats[0].hp > pkStats[2].hp ? 'win' : 'lose',
                    pkStats[1].hp > pkStats[0].hp && pkStats[1].hp > pkStats[2].hp ? 'win' : 'lose',
                    pkStats[2].hp > pkStats[0].hp && pkStats[2].hp > pkStats[1].hp ? 'win' : 'lose'
                ];

                // TIE LEFT/SELECTED
                if (pkStats[0].hp === pkStats[1].hp) {
                    results[0] = results[1] = pkStats[0].hp > pkStats[2].hp ? 'tie-win' : 'tie-lose';
                    results[2] = pkStats[0].hp > pkStats[2].hp ? 'lose' : 'win';

                // TIE LEFT/RIGHT
                } else if (pkStats[0].hp === pkStats[2].hp) {
                    results[0] = results[2] = pkStats[0].hp > pkStats[1].hp ? 'tie-win' : 'tie-lose';
                    results[1] = pkStats[0].hp > pkStats[1].hp ? 'lose' : 'win';

                // TIE SELECTED/RIGHT
                } else if (pkStats[1].hp === pkStats[2].hp) {
                    results[1] = results[2] = pkStats[1].hp > pkStats[0].hp ? 'tie-win' : 'tie-lose';
                    results[0] = pkStats[1].hp > pkStats[0].hp ? 'lose' : 'win';

                // TIE LEFT/SELECTED/RIGHT
                } else if (pkStats.every(stat => stat.defense === pkStats[0].defense)) {
                    results.fill('tie-win');
                }

                //FINAL RESULT
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
                resultsStorage.push(finalResult);   

                // SHOW RESULTs IN CONSOLE
                console.log(`Left HP: ${pkStats[0].hp} = ${results[0]}`);
                console.log(`Selected HP: ${pkStats[1].hp} = ${results[1]}`);
                console.log(`Right HP: ${pkStats[2].hp} = ${results[2]}`);
                console.log(`Final Result: ${finalResult}`);
                console.log(resultsStorage)

                // CONTAINERS AND ELEMENTS
                const containerClasses = ['result-container', 'result-container2', 'result-container3'];
                const elementClasses = ['result-text', 'result-text2', 'result-text3'];

                containerClasses.forEach((containerClass, index) => {
                    const resultContainer = document.createElement('div');
                    resultContainer.className = containerClass;

                    const resultElement = document.createElement('div');
                    resultElement.className = elementClasses[index];
                    resultElement.innerHTML = `${pkStats[index].hp}`;
                    resultContainer.appendChild(resultElement);

                    document.getElementById('minigame-container').appendChild(resultContainer);
                });


                // GRAYSCALE IF LOSE
                pkImgs.forEach((img, index) => {
                    if (index === 1) {
                        if (results[1] === 'lose' || results[1] === 'tie-lose') {
                            img.style.filter = 'grayscale(100%)';
                        }
                    } else {
                        if (results[index] === 'lose' || results[index] === 'tie-lose') {
                            img.style.filter = 'grayscale(100%)';
                        }
                    }
                });

            // BORDER COLOR RESULT
            const selectedPkId = confirmedPkId.id;
            const selectedBox = Array.from(boxesbarContainer.children).find(box => {
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
                    borderColor = '#71d15d';            
                } else if (finalResult === 'Lose!') {
                    borderColor = '#d15d5d';            
                } else if (finalResult === 'Tie!') {
                    borderColor = 'yellow';            
                }

                if (borderColor) {
                    selectedBox.style.borderColor = borderColor;
                } else {
                    console.error('Resultado final desconocido:', finalResult);
                }

            // CONTINUE BUTTON
            const continueButton = document.createElement('button');
            continueButton.classList.add('continue-button');
            continueButton.style.display = 'block';
            continueButton.innerText = 'Continue...';

            continueButton.addEventListener('click', () => {
                clickSound.currentTime = 0;
                clickSound.volume = soundVolumeControl.value;
                clickSound.play();
                continueButton.remove();
                minigameContainer.innerHTML = '';
                pkLoadConfirmed = false;
                contestPhaseAttack();
            });

            document.getElementById('minigame-container').appendChild(continueButton);

            } else {
                console.error('No se encontró la caja seleccionada.');
            }

            console.log('Contest Phase HP ended');
            });
        }
        waitForSelection();
    }

                                                                    // ATTACK CONTEST
    function contestPhaseAttack() {
        console.log('Attack contest start');
        const contestText = document.createElement('div');
        contestText.classList.add('contest-text');
        contestText.innerHTML = 'ATTACK CONTEST! <br> Choose the Pokémon to participate!';
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
                }, 100);
            };

            fadeInImage(sideImgs[0]);
            console.log('Left stats:', sidePkData[0]);

            fadeInImage(centerImg.cloneNode(true));
            console.log('Selected stats:', confirmedPkId);

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

        // WAIT FOR SELECTION 
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
                                resolve();
                            });
                        }
                    });
                });
            });
        }

                                                                //BATALLA

        // Función para iniciar la batalla
        function startBattle() {

            // FIGHT SOUND
            battleMusic.currentTime = 0;
            battleMusic.volume = musicVolumeControl.value;
            battleMusic.play();

            const pkImgs = document.querySelectorAll('#minigame-container img');

            // SHAKE IMGS
            pkImgs.forEach(img => {
            img.style.transition = 'transform 0.1s ease-in-out';
            img.style.animation = 'shake 0.5s ease-in-out 5';
            });

            // SHOW RESULTS
            pkImgs[0].addEventListener('animationend', async () => {
                const pkStats = [];
                pkStats.push(await getPkData(parseInt(pkImgs[0].alt.replace('Pk ', ''), 10)));
                pkStats.push(confirmedPkId.stats);
                pkStats.push(await getPkData(parseInt(pkImgs[2].alt.replace('Pk ', ''), 10)));


                const results = [
                    pkStats[0].attack > pkStats[1].attack && pkStats[0].attack > pkStats[2].attack ? 'win' : 'lose',
                    pkStats[1].attack > pkStats[0].attack && pkStats[1].attack > pkStats[2].attack ? 'win' : 'lose',
                    pkStats[2].attack > pkStats[0].attack && pkStats[2].attack > pkStats[1].attack ? 'win' : 'lose'
                ];

                // TIE LEFT/SELECTED
                if (pkStats[0].attack === pkStats[1].attack) {
                    results[0] = results[1] = pkStats[0].attack > pkStats[2].attack ? 'tie-win' : 'tie-lose';
                    results[2] = pkStats[0].attack > pkStats[2].attack ? 'lose' : 'win';

                // TIE LEFT/RIGHT
                } else if (pkStats[0].attack === pkStats[2].attack) {
                    results[0] = results[2] = pkStats[0].attack > pkStats[1].attack ? 'tie-win' : 'tie-lose';
                    results[1] = pkStats[0].attack > pkStats[1].attack ? 'lose' : 'win';

                // TIE SELECTED/RIGHT
                } else if (pkStats[1].attack === pkStats[2].attack) {
                    results[1] = results[2] = pkStats[1].attack > pkStats[0].attack ? 'tie-win' : 'tie-lose';
                    results[0] = pkStats[1].attack > pkStats[0].attack ? 'lose' : 'win';

                // TIE LEFT/SELECTED/RIGHT
                } else if (pkStats.every(stat => stat.defense === pkStats[0].defense)) {
                    results.fill('tie-win');
                }

                //FINAL RESULT
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
                resultsStorage.push(finalResult);  

                // SHOW RESULTS IN CONSOLE
                console.log(`Left Attack: ${pkStats[0].attack} = ${results[0]}`);
                console.log(`Selected Attack: ${pkStats[1].attack} = ${results[1]}`);
                console.log(`Right Attack: ${pkStats[2].attack} = ${results[2]}`);
                console.log(`Final Result: ${finalResult}`);
                console.log(resultsStorage)

                // CONTAINERS AND ELEMENTS
                const containerClasses = ['result-container', 'result-container2', 'result-container3'];
                const elementClasses = ['result-text', 'result-text2', 'result-text3'];

                containerClasses.forEach((containerClass, index) => {
                    const resultContainer = document.createElement('div');
                    resultContainer.className = containerClass;

                    const resultElement = document.createElement('div');
                    resultElement.className = elementClasses[index];
                    resultElement.innerHTML = `${pkStats[index].attack}`;
                    resultContainer.appendChild(resultElement);

                    document.getElementById('minigame-container').appendChild(resultContainer);
                });

                // GRAYSCALE IF LOSE
                pkImgs.forEach((img, index) => {
                    if (index === 1) {
                        if (results[1] === 'lose' || results[1] === 'tie-lose') {
                            img.style.filter = 'grayscale(100%)';
                        }
                    } else {
                        if (results[index] === 'lose' || results[index] === 'tie-lose') {
                            img.style.filter = 'grayscale(100%)';
                        }
                    }
                });
        
            // BORDER COLOR RESULT
            const selectedPkId = confirmedPkId.id;
            const selectedBox = Array.from(boxesbarContainer.children).find(box => {
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
                    borderColor = '#71d15d';            
                } else if (finalResult === 'Lose!') {
                    borderColor = '#d15d5d';            
                } else if (finalResult === 'Tie!') {
                    borderColor = 'yellow';            
                }

                if (borderColor) {
                    selectedBox.style.borderColor = borderColor;
                } else {
                    console.error('Resultado final desconocido:', finalResult);
                }

            // CONTINUE BUTTON
            const continueButton = document.createElement('button');
            continueButton.classList.add('continue-button');
            continueButton.style.display = 'block';
            continueButton.innerText = 'Continue...';

            continueButton.addEventListener('click', () => {
                clickSound.currentTime = 0;
                clickSound.volume = soundVolumeControl.value;
                clickSound.play(); 
                continueButton.remove();
                minigameContainer.innerHTML = '';
                pkLoadConfirmed = false;
                contestPhaseDefense();
            });

            document.getElementById('minigame-container').appendChild(continueButton);

            } else {
                console.error('Selected box not found.');
            }

            console.log('Contest Phase attack ended');
            });
        }
        waitForSelection();
    }

                                                                            // DEFENSE CONTEST
function contestPhaseDefense() {
    console.log('Defense contest start');
    const contestText = document.createElement('div');
    contestText.classList.add('contest-text');
    contestText.innerHTML = 'DEFENSE CONTEST! <br> Choose the Pokémon to participate!';
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
            }, 100);
        };

        fadeInImage(sideImgs[0]);
        console.log('Left stats:', sidePkData[0]);

        fadeInImage(centerImg.cloneNode(true));
        console.log('Selected stats:', confirmedPkId);

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

    // WAIT FOR SELECTION 
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
                            resolve();
                        });
                    }
                });
            });
        });
    }

    //BATALLA
    function startBattle() {
        // FIGHT SOUND
        battleMusic.currentTime = 0;
        battleMusic.volume = musicVolumeControl.value;
        battleMusic.play();

        const pkImgs = document.querySelectorAll('#minigame-container img');

        // SHAKE IMGS
        pkImgs.forEach(img => {
        img.style.transition = 'transform 0.1s ease-in-out';
        img.style.animation = 'shake 0.5s ease-in-out 5';
        });

        // SHOW RESULTS
        pkImgs[0].addEventListener('animationend', async () => {
            const pkStats = [];
            pkStats.push(await getPkData(parseInt(pkImgs[0].alt.replace('Pk ', ''), 10)));
            pkStats.push(confirmedPkId.stats);
            pkStats.push(await getPkData(parseInt(pkImgs[2].alt.replace('Pk ', ''), 10)));

            const results = [
                pkStats[0].defense > pkStats[1].defense && pkStats[0].defense > pkStats[2].defense ? 'win' : 'lose',
                pkStats[1].defense > pkStats[0].defense && pkStats[1].defense > pkStats[2].defense ? 'win' : 'lose',
                pkStats[2].defense > pkStats[0].defense && pkStats[2].defense > pkStats[1].defense ? 'win' : 'lose'
            ];

            // TIE LEFT/SELECTED
            if (pkStats[0].defense === pkStats[1].defense) {
                results[0] = results[1] = pkStats[0].defense > pkStats[2].defense ? 'tie-win' : 'tie-lose';
                results[2] = pkStats[0].defense > pkStats[2].defense ? 'lose' : 'win';

            // TIE LEFT/RIGHT
            } else if (pkStats[0].defense === pkStats[2].defense) {
                results[0] = results[2] = pkStats[0].defense > pkStats[1].defense ? 'tie-win' : 'tie-lose';
                results[1] = pkStats[0].defense > pkStats[1].defense ? 'lose' : 'win';

            // TIE SELECTED/RIGHT
            } else if (pkStats[1].defense === pkStats[2].defense) {
                results[1] = results[2] = pkStats[1].defense > pkStats[0].defense ? 'tie-win' : 'tie-lose';
                results[0] = pkStats[1].defense > pkStats[0].defense ? 'lose' : 'win';

            // TIE LEFT/SELECTED/RIGHT
            } else if (pkStats.every(stat => stat.defense === pkStats[0].defense)) {
                results.fill('tie-win');
            }

            //FINAL RESULT
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
            resultsStorage.push(finalResult);   

            // SHOW RESULTS IN CONSOLE
            console.log(`Left Defense: ${pkStats[0].defense} = ${results[0]}`);
            console.log(`Selected Defense: ${pkStats[1].defense} = ${results[1]}`);
            console.log(`Right Defense: ${pkStats[2].defense} = ${results[2]}`);
            console.log(`Final Result: ${finalResult}`);
            console.log(resultsStorage)

            // CONTAINERS AND ELEMENTS
            const containerClasses = ['result-container', 'result-container2', 'result-container3'];
            const elementClasses = ['result-text', 'result-text2', 'result-text3'];

            containerClasses.forEach((containerClass, index) => {
                const resultContainer = document.createElement('div');
                resultContainer.className = containerClass;

                const resultElement = document.createElement('div');
                resultElement.className = elementClasses[index];
                resultElement.innerHTML = `${pkStats[index].defense}`;
                resultContainer.appendChild(resultElement);

                document.getElementById('minigame-container').appendChild(resultContainer);
            });

            // GRAYSCALE IF LOSE
            pkImgs.forEach((img, index) => {
                if (index === 1) {
                    if (results[1] === 'lose' || results[1] === 'tie-lose') {
                        img.style.filter = 'grayscale(100%)';
                    }
                } else {
                    if (results[index] === 'lose' || results[index] === 'tie-lose') {
                        img.style.filter = 'grayscale(100%)';
                    }
                }
            });
    
        // BORDER COLOR RESULT
        const selectedPkId = confirmedPkId.id;
        const selectedBox = Array.from(boxesbarContainer.children).find(box => {
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
                borderColor = '#71d15d';            
            } else if (finalResult === 'Lose!') {
                borderColor = '#d15d5d';            
            } else if (finalResult === 'Tie!') {
                borderColor = 'yellow';            
            }

            if (borderColor) {
                selectedBox.style.borderColor = borderColor;
            } else {
                console.error('Resultado final desconocido:', finalResult);
            }

        // CONTINUE BUTTON
        const continueButton = document.createElement('button');
        continueButton.classList.add('continue-button');
        continueButton.style.display = 'block';
        continueButton.innerText = 'Continue...';

        continueButton.addEventListener('click', () => {
            clickSound.currentTime = 0;
            clickSound.volume = soundVolumeControl.value;
            clickSound.play();
            continueButton.remove();
            minigameContainer.innerHTML = '';
            pkLoadConfirmed = false;
            contestPhaseSpAttack();
        });

        document.getElementById('minigame-container').appendChild(continueButton);

        } else {
            console.error('No se encontró la caja seleccionada.');
        }

        console.log('Contest Phase Defense ended');
        });
    }
    waitForSelection();
}

                                                                            // SPATTACK CONTEST
    function contestPhaseSpAttack() {
        console.log('SpAttack contest start');
        const contestText = document.createElement('div');
        contestText.classList.add('contest-text');
        contestText.innerHTML = 'SPECIAL ATTACK CONTEST! <br> Choose the Pokémon to participate!';
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
                }, 100);
            };

            fadeInImage(sideImgs[0]);
            console.log('Left stats:', sidePkData[0]);

            fadeInImage(centerImg.cloneNode(true));
            console.log('Selected stats:', confirmedPkId);

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

        // WAIT FOR SELECTION 
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
                                resolve();
                            });
                        }
                    });
                });
            });
        }

                                                                //BATALLA

        // Función para iniciar la batalla
        function startBattle() {

            // FIGHT SOUND
            battleMusic.currentTime = 0;
            battleMusic.volume = musicVolumeControl.value;
            battleMusic.play();

            const pkImgs = document.querySelectorAll('#minigame-container img');

            // SHAKE IMGS
            pkImgs.forEach(img => {
            img.style.transition = 'transform 0.1s ease-in-out';
            img.style.animation = 'shake 0.5s ease-in-out 5';
            });

            // SHOW RESULTS
            pkImgs[0].addEventListener('animationend', async () => {
                const pkStats = [];
                pkStats.push(await getPkData(parseInt(pkImgs[0].alt.replace('Pk ', ''), 10)));
                pkStats.push(confirmedPkId.stats);
                pkStats.push(await getPkData(parseInt(pkImgs[2].alt.replace('Pk ', ''), 10)));


                const results = [
                    pkStats[0].spattack > pkStats[1].spattack && pkStats[0].spattack > pkStats[2].spattack ? 'win' : 'lose',
                    pkStats[1].spattack > pkStats[0].spattack && pkStats[1].spattack > pkStats[2].spattack ? 'win' : 'lose',
                    pkStats[2].spattack > pkStats[0].spattack && pkStats[2].spattack > pkStats[1].spattack ? 'win' : 'lose'
                ];

                // TIE LEFT/SELECTED
                if (pkStats[0].spattack === pkStats[1].spattack) {
                    results[0] = results[1] = pkStats[0].spattack > pkStats[2].spattack ? 'tie-win' : 'tie-lose';
                    results[2] = pkStats[0].spattack > pkStats[2].spattack ? 'lose' : 'win';

                // TIE LEFT/RIGHT
                } else if (pkStats[0].spattack === pkStats[2].spattack) {
                    results[0] = results[2] = pkStats[0].spattack > pkStats[1].spattack ? 'tie-win' : 'tie-lose';
                    results[1] = pkStats[0].spattack > pkStats[1].spattack ? 'lose' : 'win';

                // TIE SELECTED/RIGHT
                } else if (pkStats[1].spattack === pkStats[2].spattack) {
                    results[1] = results[2] = pkStats[1].spattack > pkStats[0].spattack ? 'tie-win' : 'tie-lose';
                    results[0] = pkStats[1].spattack > pkStats[0].spattack ? 'lose' : 'win';

                // TIE LEFT/SELECTED/RIGHT
                } else if (pkStats.every(stat => stat.defense === pkStats[0].defense)) {
                    results.fill('tie-win');
                }

                //FINAL RESULT
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
                resultsStorage.push(finalResult);  

                // SHOW RESULTS IN CONSOLE
                console.log(`Left SpAttack: ${pkStats[0].spattack} = ${results[0]}`);
                console.log(`Selected SpAttack: ${pkStats[1].spattack} = ${results[1]}`);
                console.log(`Right SpAttack: ${pkStats[2].spattack} = ${results[2]}`);
                console.log(`Final Result: ${finalResult}`);
                console.log(resultsStorage)

                // CONTAINERS AND ELEMENTS
                const containerClasses = ['result-container', 'result-container2', 'result-container3'];
                const elementClasses = ['result-text', 'result-text2', 'result-text3'];

                containerClasses.forEach((containerClass, index) => {
                    const resultContainer = document.createElement('div');
                    resultContainer.className = containerClass;

                    const resultElement = document.createElement('div');
                    resultElement.className = elementClasses[index];
                    resultElement.innerHTML = `${pkStats[index].spattack}`;
                    resultContainer.appendChild(resultElement);

                    document.getElementById('minigame-container').appendChild(resultContainer);
                });

                // GRAYSCALE IF LOSE
                pkImgs.forEach((img, index) => {
                    if (index === 1) {
                        if (results[1] === 'lose' || results[1] === 'tie-lose') {
                            img.style.filter = 'grayscale(100%)';
                        }
                    } else {
                        if (results[index] === 'lose' || results[index] === 'tie-lose') {
                            img.style.filter = 'grayscale(100%)';
                        }
                    }
                });
        
            // BORDER COLOR RESULT
            const selectedPkId = confirmedPkId.id;
            const selectedBox = Array.from(boxesbarContainer.children).find(box => {
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
                    borderColor = '#71d15d';            
                } else if (finalResult === 'Lose!') {
                    borderColor = '#d15d5d';            
                } else if (finalResult === 'Tie!') {
                    borderColor = 'yellow';            
                }

                if (borderColor) {
                    selectedBox.style.borderColor = borderColor;
                } else {
                    console.error('Resultado final desconocido:', finalResult);
                }

            // CONTINUE BUTTON
            const continueButton = document.createElement('button');
            continueButton.classList.add('continue-button');
            continueButton.style.display = 'block';
            continueButton.innerText = 'Continue...';

            continueButton.addEventListener('click', () => {
                clickSound.currentTime = 0;
                clickSound.volume = soundVolumeControl.value;
                clickSound.play(); 
                continueButton.remove();
                minigameContainer.innerHTML = '';
                pkLoadConfirmed = false;
                contestPhaseSpDefense();
            });

            document.getElementById('minigame-container').appendChild(continueButton);

            } else {
                console.error('Selected box not found.');
            }

            console.log('Contest Phase special attack ended');
            });
        }
        waitForSelection();
    }

                                                                    // SPDEFENSE CONTEST
    function contestPhaseSpDefense() {
        console.log('SpDefense contest start');
        const contestText = document.createElement('div');
        contestText.classList.add('contest-text');
        contestText.innerHTML = 'SPECIAL DEFENSE CONTEST! <br> Choose the Pokémon to participate!';
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
                }, 100);
            };

            fadeInImage(sideImgs[0]);
            console.log('Left stats:', sidePkData[0]);

            fadeInImage(centerImg.cloneNode(true));
            console.log('Selected stats:', confirmedPkId);

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

        // WAIT FOR SELECTION 
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
                                resolve();
                            });
                        }
                    });
                });
            });
        }

                                                                //BATALLA

        // Función para iniciar la batalla
        function startBattle() {

            // FIGHT SOUND
            battleMusic.currentTime = 0;
            battleMusic.volume = musicVolumeControl.value;
            battleMusic.play();

            const pkImgs = document.querySelectorAll('#minigame-container img');

            // SHAKE IMGS
            pkImgs.forEach(img => {
            img.style.transition = 'transform 0.1s ease-in-out';
            img.style.animation = 'shake 0.5s ease-in-out 5';
            });

            // SHOW RESULTS
            pkImgs[0].addEventListener('animationend', async () => {
                const pkStats = [];
                pkStats.push(await getPkData(parseInt(pkImgs[0].alt.replace('Pk ', ''), 10)));
                pkStats.push(confirmedPkId.stats);
                pkStats.push(await getPkData(parseInt(pkImgs[2].alt.replace('Pk ', ''), 10)));


                const results = [
                    pkStats[0].spdefense > pkStats[1].spdefense && pkStats[0].spdefense > pkStats[2].spdefense ? 'win' : 'lose',
                    pkStats[1].spdefense > pkStats[0].spdefense && pkStats[1].spdefense > pkStats[2].spdefense ? 'win' : 'lose',
                    pkStats[2].spdefense > pkStats[0].spdefense && pkStats[2].spdefense > pkStats[1].spdefense ? 'win' : 'lose'
                ];

                // TIE LEFT/SELECTED
                if (pkStats[0].spdefense === pkStats[1].spdefense) {
                    results[0] = results[1] = pkStats[0].spdefense > pkStats[2].spdefense ? 'tie-win' : 'tie-lose';
                    results[2] = pkStats[0].spdefense > pkStats[2].spdefense ? 'lose' : 'win';

                // TIE LEFT/RIGHT
                } else if (pkStats[0].spdefense === pkStats[2].spdefense) {
                    results[0] = results[2] = pkStats[0].spdefense > pkStats[1].spdefense ? 'tie-win' : 'tie-lose';
                    results[1] = pkStats[0].spdefense > pkStats[1].spdefense ? 'lose' : 'win';

                // TIE SELECTED/RIGHT
                } else if (pkStats[1].spdefense === pkStats[2].spdefense) {
                    results[1] = results[2] = pkStats[1].spdefense > pkStats[0].spdefense ? 'tie-win' : 'tie-lose';
                    results[0] = pkStats[1].spdefense > pkStats[0].spdefense ? 'lose' : 'win';

                // TIE LEFT/SELECTED/RIGHT
                } else if (pkStats.every(stat => stat.defense === pkStats[0].defense)) {
                    results.fill('tie-win');
                }

                //FINAL RESULT
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
                resultsStorage.push(finalResult);  

                // SHOW RESULTS IN CONSOLE
                console.log(`Left SpDefense: ${pkStats[0].spdefense} = ${results[0]}`);
                console.log(`Selected SpDefense: ${pkStats[1].spdefense} = ${results[1]}`);
                console.log(`Right SpDefense: ${pkStats[2].spdefense} = ${results[2]}`);
                console.log(`Final Result: ${finalResult}`);
                console.log(resultsStorage)

                // CONTAINERS AND ELEMENTS
                const containerClasses = ['result-container', 'result-container2', 'result-container3'];
                const elementClasses = ['result-text', 'result-text2', 'result-text3'];

                containerClasses.forEach((containerClass, index) => {
                    const resultContainer = document.createElement('div');
                    resultContainer.className = containerClass;

                    const resultElement = document.createElement('div');
                    resultElement.className = elementClasses[index];
                    resultElement.innerHTML = `${pkStats[index].spdefense}`;
                    resultContainer.appendChild(resultElement);

                    document.getElementById('minigame-container').appendChild(resultContainer);
                });

                // GRAYSCALE IF LOSE
                pkImgs.forEach((img, index) => {
                    if (index === 1) {
                        if (results[1] === 'lose' || results[1] === 'tie-lose') {
                            img.style.filter = 'grayscale(100%)';
                        }
                    } else {
                        if (results[index] === 'lose' || results[index] === 'tie-lose') {
                            img.style.filter = 'grayscale(100%)';
                        }
                    }
                });
        
            // BORDER COLOR RESULT
            const selectedPkId = confirmedPkId.id;
            const selectedBox = Array.from(boxesbarContainer.children).find(box => {
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
                    borderColor = '#71d15d';            
                } else if (finalResult === 'Lose!') {
                    borderColor = '#d15d5d';            
                } else if (finalResult === 'Tie!') {
                    borderColor = 'yellow';            
                }

                if (borderColor) {
                    selectedBox.style.borderColor = borderColor;
                } else {
                    console.error('Resultado final desconocido:', finalResult);
                }

            // CONTINUE BUTTON
            const continueButton = document.createElement('button');
            continueButton.classList.add('continue-button');
            continueButton.style.display = 'block';
            continueButton.innerText = 'Continue...';

            continueButton.addEventListener('click', () => {
                clickSound.currentTime = 0;
                clickSound.volume = soundVolumeControl.value;
                clickSound.play(); 
                continueButton.remove();
                minigameContainer.innerHTML = '';
                pkLoadConfirmed = false;
                contestPhaseSpeed();
            });

            document.getElementById('minigame-container').appendChild(continueButton);

            } else {
                console.error('Selected box not found.');
            }

            console.log('Contest Phase spdefense ended');
            });
        }
        waitForSelection();
    }

                                                                    // SPEED CONTEST
    function contestPhaseSpeed() {
        console.log('Speed contest start');
        const contestText = document.createElement('div');
        contestText.classList.add('contest-text');
        contestText.innerHTML = 'SPEED CONTEST! <br> Choose the Pokémon to participate!';
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
                }, 100);
            };

            fadeInImage(sideImgs[0]);
            console.log('Left stats:', sidePkData[0]);

            fadeInImage(centerImg.cloneNode(true));
            console.log('Selected stats:', confirmedPkId);

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

        // WAIT FOR SELECTION 
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
                                resolve();
                            });
                        }
                    });
                });
            });
        }

                                                                //BATALLA

        // Función para iniciar la batalla
        function startBattle() {

            // FIGHT SOUND
            battleMusic.currentTime = 0;
            battleMusic.volume = musicVolumeControl.value;
            battleMusic.play();

            const pkImgs = document.querySelectorAll('#minigame-container img');

            // SHAKE IMGS
            pkImgs.forEach(img => {
            img.style.transition = 'transform 0.1s ease-in-out';
            img.style.animation = 'shake 0.5s ease-in-out 5';
            });

            // SHOW RESULTS
            pkImgs[0].addEventListener('animationend', async () => {
                const pkStats = [];
                pkStats.push(await getPkData(parseInt(pkImgs[0].alt.replace('Pk ', ''), 10)));
                pkStats.push(confirmedPkId.stats);
                pkStats.push(await getPkData(parseInt(pkImgs[2].alt.replace('Pk ', ''), 10)));


                const results = [
                    pkStats[0].speed > pkStats[1].speed && pkStats[0].speed > pkStats[2].speed ? 'win' : 'lose',
                    pkStats[1].speed > pkStats[0].speed && pkStats[1].speed > pkStats[2].speed ? 'win' : 'lose',
                    pkStats[2].speed > pkStats[0].speed && pkStats[2].speed > pkStats[1].speed ? 'win' : 'lose'
                ];

                // TIE LEFT/SELECTED
                if (pkStats[0].speed === pkStats[1].speed) {
                    results[0] = results[1] = pkStats[0].speed > pkStats[2].speed ? 'tie-win' : 'tie-lose';
                    results[2] = pkStats[0].speed > pkStats[2].speed ? 'lose' : 'win';

                // TIE LEFT/RIGHT
                } else if (pkStats[0].speed === pkStats[2].speed) {
                    results[0] = results[2] = pkStats[0].speed > pkStats[1].speed ? 'tie-win' : 'tie-lose';
                    results[1] = pkStats[0].speed > pkStats[1].speed ? 'lose' : 'win';

                // TIE SELECTED/RIGHT
                } else if (pkStats[1].speed === pkStats[2].speed) {
                    results[1] = results[2] = pkStats[1].speed > pkStats[0].speed ? 'tie-win' : 'tie-lose';
                    results[0] = pkStats[1].speed > pkStats[0].speed ? 'lose' : 'win';

                // TIE LEFT/SELECTED/RIGHT
                } else if (pkStats.every(stat => stat.defense === pkStats[0].defense)) {
                    results.fill('tie-win');
                }

                //FINAL RESULT
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
                resultsStorage.push(finalResult);  

                // SHOW RESULTS IN CONSOLE
                console.log(`Left Speed: ${pkStats[0].speed} = ${results[0]}`);
                console.log(`Selected Speed: ${pkStats[1].speed} = ${results[1]}`);
                console.log(`Right Speed: ${pkStats[2].speed} = ${results[2]}`);
                console.log(`Final Result: ${finalResult}`);
                console.log(resultsStorage)

                // CONTAINERS AND ELEMENTS
                const containerClasses = ['result-container', 'result-container2', 'result-container3'];
                const elementClasses = ['result-text', 'result-text2', 'result-text3'];

                containerClasses.forEach((containerClass, index) => {
                    const resultContainer = document.createElement('div');
                    resultContainer.className = containerClass;

                    const resultElement = document.createElement('div');
                    resultElement.className = elementClasses[index];
                    resultElement.innerHTML = `${pkStats[index].speed}`;
                    resultContainer.appendChild(resultElement);

                    document.getElementById('minigame-container').appendChild(resultContainer);
                });

                // GRAYSCALE IF LOSE
                pkImgs.forEach((img, index) => {
                    if (index === 1) {
                        if (results[1] === 'lose' || results[1] === 'tie-lose') {
                            img.style.filter = 'grayscale(100%)';
                        }
                    } else {
                        if (results[index] === 'lose' || results[index] === 'tie-lose') {
                            img.style.filter = 'grayscale(100%)';
                        }
                    }
                });
        
            // BORDER COLOR RESULT
            const selectedPkId = confirmedPkId.id;
            const selectedBox = Array.from(boxesbarContainer.children).find(box => {
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
                    borderColor = '#71d15d';            
                } else if (finalResult === 'Lose!') {
                    borderColor = '#d15d5d';            
                } else if (finalResult === 'Tie!') {
                    borderColor = 'yellow';            
                }

                if (borderColor) {
                    selectedBox.style.borderColor = borderColor;
                } else {
                    console.error('Resultado final desconocido:', finalResult);
                }

            // CONTINUE BUTTON
            const continueButton = document.createElement('button');
            continueButton.classList.add('continue-button');
            continueButton.style.display = 'block';
            continueButton.innerText = 'Continue...';

            continueButton.addEventListener('click', () => {
                clickSound.currentTime = 0;
                clickSound.volume = soundVolumeControl.value;
                clickSound.play(); 
                continueButton.remove();
                minigameContainer.innerHTML = '';
                pkLoadConfirmed = false;
                gradePhase();
            });

            document.getElementById('minigame-container').appendChild(continueButton);

            } else {
                console.error('Selected box not found.');
            }

            console.log('Contest Phase speed ended');
            });
        }
        waitForSelection();
    }

// GRADE PHASE

    function gradePhase() {
        let grade = 0;
        for (let i = 0; i < resultsStorage.length; i++) {
            switch (resultsStorage[i]) {
                case 'Victory!':
                    grade += 1;
                    break;
                case 'Tie!':
                    grade += 0.5;
                    break;
                default:
                    break;
        }
    }

    let gradeOutOf10 = (grade / 6) * 10;
    gradeOutOf10 = Math.round(gradeOutOf10 * 10) / 10;
    if (Number.isInteger(gradeOutOf10)) {
        gradeOutOf10 = Math.round(gradeOutOf10);
    }

    const pkContainer = document.getElementById('minigame-container');
    const resultElement = document.createElement('p');
    resultElement.textContent = `FINAL GRADE: ${gradeOutOf10}/10`;
    resultElement.classList.add('final-grade');
    pkContainer.appendChild(resultElement);
    }

    addRandomImgPk();
});
