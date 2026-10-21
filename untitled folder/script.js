
document.addEventListener("DOMContentLoaded", () => {
    // ==============================
    // STUDYSYNC - FOCUS TIMER
    // ==============================

    const timerDisplay = document.getElementById("timer");
    const timerStatus = document.getElementById("timer-status");
    const startButton = document.getElementById("start-timer");
    const resetButton = document.getElementById("reset-timer");
    const focusTotal = document.getElementById("focus-total");
    const sessionTotal = document.getElementById("session-total");

    let timerMode = "focus";
    let remainingSeconds = 25 * 60;
    let timerInterval = null;
    let focusMinutes = Number(
        localStorage.getItem("studysync-focus-minutes") || 0
    );
    let completedSessions = Number(
        localStorage.getItem("studysync-completed-sessions") || 0
    );

    function renderTimer() {
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;

        if (timerDisplay) {
            timerDisplay.textContent =
                `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        }
    }

    function updateTimerSummary() {
        if (focusTotal) {
            focusTotal.textContent = `${focusMinutes} min`;
        }

        if (sessionTotal) {
            sessionTotal.textContent = completedSessions;
        }
    }

    function stopTimer() {
        if (timerInterval !== null) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function startTimer() {
        if (timerInterval !== null) {
            stopTimer();

            if (startButton) {
                startButton.textContent =
                    timerMode === "focus" ? "Start focus" : "Start break";
            }

            if (timerStatus) {
                timerStatus.textContent = "Timer paused.";
            }

            return;
        }

        if (remainingSeconds <= 0) {
            remainingSeconds = timerMode === "focus" ? 25 * 60 : 5 * 60;
            renderTimer();
        }

        if (startButton) {
            startButton.textContent = "Pause";
        }

        if (timerStatus) {
            timerStatus.textContent =
                timerMode === "focus"
                    ? "Stay focused. You've got this!"
                    : "Take a break. You've earned it!";
        }

        timerInterval = setInterval(() => {
            remainingSeconds--;
            renderTimer();

            if (remainingSeconds <= 0) {
                stopTimer();

                if (timerMode === "focus") {
                    completedSessions++;
                    focusMinutes += 25;

                    localStorage.setItem(
                        "studysync-focus-minutes",
                        focusMinutes
                    );

                    localStorage.setItem(
                        "studysync-completed-sessions",
                        completedSessions
                    );

                    timerMode = "break";
                    remainingSeconds = 5 * 60;

                    if (timerStatus) {
                        timerStatus.textContent =
                            "Focus session complete! Time for a break.";
                    }

                    alert("Focus session complete! Great work.");
                } else {
                    timerMode = "focus";
                    remainingSeconds = 25 * 60;

                    if (timerStatus) {
                        timerStatus.textContent =
                            "Break complete. Ready to focus again?";
                    }

                    alert("Break complete! Ready for another focus session?");
                }

                if (startButton) {
                    startButton.textContent =
                        timerMode === "focus" ? "Start focus" : "Start break";
                }

                renderTimer();
                updateTimerSummary();
            }
        }, 1000);
    }

    if (startButton) {
        startButton.addEventListener("click", startTimer);
    }

    if (resetButton) {
        resetButton.addEventListener("click", () => {
            stopTimer();
            timerMode = "focus";
            remainingSeconds = 25 * 60;
            renderTimer();

            if (startButton) {
                startButton.textContent = "Start focus";
            }

            if (timerStatus) {
                timerStatus.textContent = "Timer reset. Ready when you are?";
            }
        });
    }

    renderTimer();
    updateTimerSummary();


    // ==============================
    // STUDYSYNC - TASK MANAGEMENT
    // ==============================

    const taskForm = document.getElementById("task-form");
    const taskInput = document.getElementById("task-input");
    const taskList = document.getElementById("task-list");
    const taskTotal = document.getElementById("task-total");
    const emptyTasks = document.getElementById("empty-tasks");

    let tasks = [];

    try {
        tasks = JSON.parse(
            localStorage.getItem("studysync-tasks") || "[]"
        );

        if (!Array.isArray(tasks)) {
            tasks = [];
        }
    } catch (error) {
        tasks = [];
    }

    function saveTasks() {
        localStorage.setItem("studysync-tasks", JSON.stringify(tasks));
    }

    function updateTaskSummary() {
        const completed = tasks.filter(task => task.done).length;

        if (taskTotal) {
            taskTotal.textContent = `${completed} / ${tasks.length}`;
        }

        if (emptyTasks) {
            emptyTasks.hidden = tasks.length > 0;
        }
    }

    function renderTasks() {
        if (!taskList) return;

        taskList.innerHTML = "";

        tasks.forEach(task => {
            const item = document.createElement("li");
            item.className = task.done ? "done" : "";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task.done;
            checkbox.setAttribute("aria-label", "Complete task");

            checkbox.addEventListener("change", () => {
                task.done = checkbox.checked;
                item.classList.toggle("done", task.done);
                saveTasks();
                updateTaskSummary();
            });

            const label = document.createElement("span");
            label.textContent = task.text;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.textContent = "Delete";
            removeButton.setAttribute("aria-label", "Delete task");

            removeButton.addEventListener("click", () => {
                tasks = tasks.filter(currentTask => currentTask.id !== task.id);
                saveTasks();
                renderTasks();
            });

            item.append(checkbox, label, removeButton);
            taskList.appendChild(item);
        });

        updateTaskSummary();
    }

    function addTask(text) {
        const trimmedText = text.trim();

        if (!trimmedText) return;

        tasks.push({
            id: Date.now() + Math.random(),
            text: trimmedText,
            done: false
        });

        saveTasks();
        renderTasks();
    }

    if (taskForm && taskInput) {
        taskForm.addEventListener("submit", event => {
            event.preventDefault();
            addTask(taskInput.value);
            taskInput.value = "";
            taskInput.focus();
        });
    }

    renderTasks();

    // ==============================
    // STUDYSYNC - STUDY ROOMS
    // ==============================

    // STUDYSYNC - STUDY ROOMS CONNECTED TO JAVA API

    const createRoomButton = document.getElementById("create-room");
    const roomForm = document.getElementById("room-form");
    const roomNameInput = document.getElementById("room-name");
    const cancelRoomButton = document.getElementById("cancel-room");
    const customRooms = document.getElementById("custom-rooms");
    const roomMessage = document.getElementById("room-message");

    const ROOMS_API = "http://localhost:8080/api/rooms";
    let rooms = [];

    async function loadRooms() {
        if (!customRooms) return;

        try {
            const response = await fetch(ROOMS_API);
            if (!response.ok) throw new Error("Could not load rooms");

            rooms = await response.json();
            renderRooms();
        } catch (error) {
            if (roomMessage) {
                roomMessage.textContent =
                    "Could not load rooms. Check that the Java server is running.";
                roomMessage.hidden = false;
            }
        }
    }

    function renderRooms() {
        if (!customRooms) return;

        customRooms.replaceChildren();

        rooms.forEach(room => {
            const card = document.createElement("div");
            card.className = "custom-room";

            const info = document.createElement("div");
            info.className = "room-info";

            const title = document.createElement("h3");
            title.textContent = room.name;

            const description = document.createElement("p");
            description.textContent = `Room code: ${room.code}`;

            info.append(title, description);

            const joinButton = document.createElement("button");
            joinButton.textContent = "Join";
            joinButton.className = "secondary";

            joinButton.addEventListener("click", async () => {
                try {
                    const response = await fetch(
                        `${ROOMS_API}/${encodeURIComponent(room.code)}/join`,
                        { method: "POST" }
                    );
                    const data = await response.json();

                    if (!response.ok) throw new Error(data.error || "Join failed");

                    if (roomMessage) {
                        roomMessage.textContent = data.message;
                        roomMessage.hidden = false;
                    }
                } catch (error) {
                    if (roomMessage) {
                        roomMessage.textContent = error.message;
                        roomMessage.hidden = false;
                    }
                }
            });

            card.append(info, joinButton);
            customRooms.appendChild(card);
        });
    }

    if (createRoomButton && roomForm && roomNameInput) {
        createRoomButton.addEventListener("click", () => {
            roomForm.hidden = false;
            roomNameInput.focus();
        });
    }

    if (cancelRoomButton && roomForm) {
        cancelRoomButton.addEventListener("click", () => {
            roomForm.reset();
            roomForm.hidden = true;
        });
    }

    if (roomForm && roomNameInput) {
        roomForm.addEventListener("submit", async event => {
            event.preventDefault();

            const name = roomNameInput.value.trim();
            if (!name) return;

            try {
                const response = await fetch(ROOMS_API, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Could not create room");
                }

                roomForm.reset();
                roomForm.hidden = true;

                if (roomMessage) {
                    roomMessage.textContent =
                        `Room "${data.name}" created! Code: ${data.code}`;
                    roomMessage.hidden = false;
                }

                await loadRooms();
            } catch (error) {
                if (roomMessage) {
                    roomMessage.textContent =
                        "Could not create room. Check that the Java server is running.";
                    roomMessage.hidden = false;
                }
            }
        });
    }

    loadRooms();


    // Connect StudySync frontend to Java backend
    const serverMessage = document.getElementById("server-message");
    const checkServerButton = document.getElementById("check-server");

    async function checkStudySyncServer() {
        if (!serverMessage) return;

        serverMessage.textContent = "Connecting...";

        try {
            const response = await fetch("http://localhost:8080/api/rooms");
            if (!response.ok) {
                throw new Error("Server returned an error");
            }

            const data = await response.json();
            serverMessage.textContent =
                data.status || "Java backend connected!";
        } catch (error) {
            serverMessage.textContent =
                "Could not connect. Make sure the Java server is running.";
        }
    }

    if (checkServerButton) {
        checkServerButton.addEventListener("click", checkStudySyncServer);
    }
    
    // Join an existing StudySync room using its code
    const joinRoomForm = document.getElementById("join-room-form");
    const joinRoomCodeInput = document.getElementById("join-room-code");
    const joinRoomMessage = document.getElementById("join-room-message");

    if (joinRoomForm && joinRoomCodeInput) {
        joinRoomForm.addEventListener("submit", async event => {
            event.preventDefault();

            const code = joinRoomCodeInput.value.trim().toUpperCase();

            if (!code) return;

            if (joinRoomMessage) {
                joinRoomMessage.textContent = "Checking room code...";
            }

            try {
                const response = await fetch(
                    `${ROOMS_API}/${encodeURIComponent(code)}/join`,
                    { method: "POST" }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Room not found.");
                }

                if (joinRoomMessage) {
                    joinRoomMessage.textContent =
                        `Successfully joined "${data.name}"! Room code: ${data.code}`;
                }

                joinRoomCodeInput.value = "";
            } catch (error) {
                if (joinRoomMessage) {
                    joinRoomMessage.textContent =
                        error.message === "Failed to fetch"
                            ? "Cannot connect to Java. Check that the server is running."
                            : error.message;
                }
            }
        });
    }

    checkStudySyncServer();

});
