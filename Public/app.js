const form = document.getElementById("form");
const input = document.getElementById("input");
const chat = document.getElementById("chat");
const welcome = document.getElementById("welcome");

const settings = document.getElementById("settings");
const modelsPanel = document.getElementById("modelsPanel");

const apiKey = document.getElementById("apiKey");

const model1 = document.getElementById("model1");
const model2 = document.getElementById("model2");
const model3 = document.getElementById("model3");
const judge = document.getElementById("judge");

const settingsMessage =
    document.getElementById("settingsMessage");

const connectionDot =
    document.getElementById("connectionDot");

const connectionText =
    document.getElementById("connectionText");

let sessionId =
    localStorage.getItem("god_bing_session");


// No guardamos la API key.
// Solo guardamos un identificador de sesión.

if (!sessionId) {

    sessionId = crypto.randomUUID();

    localStorage.setItem(
        "god_bing_session",
        sessionId
    );

}


function headers() {

    return {
        "Content-Type": "application/json",
        "X-God-Bing-Session": sessionId
    };

}


// ==========================
// PANEL CONFIGURACIÓN
// ==========================

function openSettings() {

    settings.classList.add("show");

}


function closeSettings() {

    settings.classList.remove("show");

}


document
    .getElementById("openSettings")
    .onclick = openSettings;

document
    .getElementById("mobileSettings")
    .onclick = openSettings;

document
    .getElementById("closeSettings")
    .onclick = closeSettings;


// ==========================
// MOSTRAR API KEY
// ==========================

document
    .getElementById("showKey")
    .onclick = () => {

        apiKey.type =
            apiKey.type === "password"
                ? "text"
                : "password";

    };


// ==========================
// GUARDAR
// ==========================

document
    .getElementById("save")
    .onclick = async () => {

        const key =
            apiKey.value.trim();

        if (!key) {

            showSettingsMessage(
                "Introduce tu API Key.",
                true
            );

            return;

        }


        showSettingsMessage(
            "Guardando..."
        );


        try {

            const response =
                await fetch(
                    "/api/settings",
                    {
                        method: "POST",

                        headers: headers(),

                        body: JSON.stringify({

                            apiKey: key,

                            model1:
                                model1.value.trim(),

                            model2:
                                model2.value.trim(),

                            model3:
                                model3.value.trim(),

                            judge:
                                judge.value.trim()

                        })

                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error
                );

            }


            showSettingsMessage(
                "✅ Configuración guardada."
            );

            setOnline(true);

        } catch (error) {

            showSettingsMessage(
                "❌ " + error.message,
                true
            );

        }

    };


// ==========================
// PROBAR
// ==========================

document
    .getElementById("test")
    .onclick = async () => {

        const key =
            apiKey.value.trim();

        showSettingsMessage(
            "🧪 Probando conexión..."
        );


        try {

            const response =
                await fetch(
                    "/api/test",
                    {
                        method: "POST",

                        headers: headers(),

                        body: JSON.stringify({
                            apiKey: key,
                            model: model1.value
                        })

                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error
                );

            }


            showSettingsMessage(
                "✅ OpenRouter funciona correctamente."
            );

            setOnline(true);

        } catch (error) {

            showSettingsMessage(
                "❌ " + error.message,
                true
            );

            setOnline(false);

        }

    };


function showSettingsMessage(
    message,
    error = false
) {

    settingsMessage.textContent =
        message;

    settingsMessage.style.color =
        error
            ? "#ef4444"
            : "#22c55e";

}


// ==========================
// ESTADO
// ==========================

async function checkStatus() {

    try {

        const response =
            await fetch(
                "/api/status",
                {
                    headers: headers()
                }
            );

        const data =
            await response.json();


        if (data.configured) {

            setOnline(true);

            model1.value =
                data.models.model1;

            model2.value =
                data.models.model2;

            model3.value =
                data.models.model3;

            judge.value =
                data.models.judge;

        } else {

            setOnline(false);

        }

    } catch {

        setOnline(false);

    }

}


function setOnline(online) {

    if (online) {

        connectionDot
            .classList.add("online");

        connectionText.textContent =
            "OpenRouter conectado";

    } else {

        connectionDot
            .classList.remove("online");

        connectionText.textContent =
            "Sin configurar";

    }

}


// ==========================
// MODELOS
// ==========================

document
    .getElementById("openModels")
    .onclick = () => {

        modelsPanel.classList.add("show");

    };


document
    .getElementById("closeModels")
    .onclick = () => {

        modelsPanel.classList.remove("show");

    };


// ==========================
// PREGUNTAS SUGERIDAS
// ==========================

document
    .querySelectorAll("[data-question]")
    .forEach(button => {

        button.onclick = () => {

            input.value =
                button.dataset.question;

            input.focus();

        };

    });


// ==========================
// MARKDOWN BÁSICO
// ==========================

function render(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML
        .replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        )
        .replace(
            /`([^`]+)`/g,
            "<code>$1</code>"
        )
        .replace(/\n/g, "<br>");

}


// ==========================
// MENSAJE USUARIO
// ==========================

function addUser(text) {

    const message =
        document.createElement("div");

    message.className =
        "message user";

    message.innerHTML = `

        <div class="user-text">
            ${render(text)}
        </div>

    `;

    chat.appendChild(message);

    scroll();

}


// ==========================
// LOADING
// ==========================

function addLoading() {

    const message =
        document.createElement("div");

    message.id =
        "loading";

    message.className =
        "message";

    message.innerHTML = `

        <div class="answer">

            <div class="loading">
                🧠 Consultando 3 modelos y
                comparando respuestas...
            </div>

        </div>

    `;

    chat.appendChild(message);

    scroll();

}


function removeLoading() {

    document
        .getElementById("loading")
        ?.remove();

}


// ==========================
// RESPUESTA FINAL
// ==========================

function addAnswer(text) {

    const message =
        document.createElement("div");

    message.className =
        "message";

    message.innerHTML = `

        <div class="answer">

            <div class="answer-title">
                ✨ GOD BING
            </div>

            <div>
                ${render(text)}
            </div>

        </div>

    `;

    chat.appendChild(message);

    scroll();

}


// ==========================
// RESPUESTAS INDIVIDUALES
// ==========================

function showModels(data) {

    const container =
        document.getElementById(
            "modelAnswers"
        );

    container.innerHTML = "";


    const items = [

        ["Modelo 1", data.model1],

        ["Modelo 2", data.model2],

        ["Modelo 3", data.model3]

    ];


    items.forEach(([name, info]) => {

        const card =
            document.createElement("div");

        card.className =
            "model-card";

        card.innerHTML = `

            <h3>
                ${name}
            </h3>

            <small>
                ${info.model}
            </small>

            <p>
                ${render(info.answer)}
            </p>

        `;

        container.appendChild(card);

    });

}


// ==========================
// ENVIAR
// ==========================

form.onsubmit = async event => {

    event.preventDefault();


    const question =
        input.value.trim();


    if (!question) return;


    welcome.style.display =
        "none";


    addUser(question);

    input.value = "";

    addLoading();


    document
        .getElementById("send")
        .disabled = true;


    try {

        const response =
            await fetch(
                "/api/ask",
                {
                    method: "POST",

                    headers: headers(),

                    body: JSON.stringify({
                        question
                    })

                }
            );


        const data =
            await response.json();


        removeLoading();


        if (!response.ok) {

            throw new Error(
                data.error
            );

        }


        addAnswer(
            data.final
        );


        showModels(
            data.models
        );


        setOnline(true);

    } catch (error) {

        removeLoading();

        addAnswer(
            "❌ " + error.message
        );

    } finally {

        document
            .getElementById("send")
            .disabled = false;

        input.focus();

    }

};


// ==========================
// NUEVO CHAT
// ==========================

document
    .getElementById("newChat")
    .onclick = () => {

        chat.innerHTML = "";

        chat.appendChild(welcome);

        welcome.style.display =
            "block";

    };


// ==========================
// SCROLL
// ==========================

function scroll() {

    chat.scrollTo({

        top: chat.scrollHeight,

        behavior: "smooth"

    });

}


checkStatus();
