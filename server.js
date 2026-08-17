import express from "express";
import cors from "cors";
import crypto from "crypto";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

const sessions = new Map();

const DEFAULT_MODELS = {
    model1: "openai/gpt-5.3-chat",
    model2: "anthropic/claude-sonnet-4.5",
    model3: "google/gemini-2.5-flash",
    judge: "openai/gpt-5.3-chat"
};

function getSession(req, res) {

    let id = req.headers["x-god-bing-session"];

    if (!id) {
        id = crypto.randomUUID();
        res.setHeader("X-God-Bing-Session", id);
    }

    if (!sessions.has(id)) {
        sessions.set(id, {
            apiKey: "",
            models: { ...DEFAULT_MODELS }
        });
    }

    return sessions.get(id);
}


function clean(value) {
    return typeof value === "string" ? value.trim() : "";
}


async function openRouter(model, messages, apiKey) {

    const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",

            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "X-Title": "GOD BING AI"
            },

            body: JSON.stringify({
                model,
                messages,
                temperature: 0.4
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {

        throw new Error(
            data?.error?.message ||
            `OpenRouter HTTP ${response.status}`
        );
    }

    return data?.choices?.[0]?.message?.content || "";
}


// ===============================
// GUARDAR CONFIGURACIÓN
// ===============================

app.post("/api/settings", (req, res) => {

    try {

        const session = getSession(req, res);

        const apiKey = clean(req.body.apiKey);

        if (!apiKey) {

            return res.status(400).json({
                error: "Introduce una API Key de OpenRouter."
            });
        }

        session.apiKey = apiKey;

        session.models = {

            model1:
                clean(req.body.model1) ||
                DEFAULT_MODELS.model1,

            model2:
                clean(req.body.model2) ||
                DEFAULT_MODELS.model2,

            model3:
                clean(req.body.model3) ||
                DEFAULT_MODELS.model3,

            judge:
                clean(req.body.judge) ||
                DEFAULT_MODELS.judge
        };

        res.json({
            success: true,
            message: "Configuración guardada."
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

});


// ===============================
// ESTADO
// ===============================

app.get("/api/status", (req, res) => {

    const session = getSession(req, res);

    res.json({
        configured: Boolean(session.apiKey),
        models: session.models
    });

});


// ===============================
// PROBAR API
// ===============================

app.post("/api/test", async (req, res) => {

    try {

        const session = getSession(req, res);

        const apiKey =
            clean(req.body.apiKey) ||
            session.apiKey;

        if (!apiKey) {

            return res.status(400).json({
                error: "No hay una API Key."
            });

        }

        const model =
            clean(req.body.model) ||
            session.models.model1;

        const answer = await openRouter(
            model,
            [
                {
                    role: "user",
                    content:
                        "Responde solamente: GOD BING conectado correctamente."
                }
            ],
            apiKey
        );

        res.json({
            success: true,
            answer
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

});


// ===============================
// PREGUNTA PRINCIPAL
// ===============================

app.post("/api/ask", async (req, res) => {

    try {

        const session = getSession(req, res);

        if (!session.apiKey) {

            return res.status(401).json({
                error:
                    "Primero configura tu OpenRouter API Key."
            });

        }

        const question = clean(req.body.question);

        if (!question) {

            return res.status(400).json({
                error: "Escribe una pregunta."
            });

        }

        const models = session.models;


        const prompts = {

            model1: `
Eres el primer experto de GOD BING.

Analiza la pregunta del usuario cuidadosamente.

Da una respuesta precisa, útil y clara.
Explica tus razones cuando sea necesario.
No inventes información.

Pregunta:
${question}
`,

            model2: `
Eres el segundo experto de GOD BING.

Resuelve la pregunta de forma independiente.
Busca posibles errores o supuestos incorrectos.
Sé preciso y práctico.

Pregunta:
${question}
`,

            model3: `
Eres el tercer experto de GOD BING.

Analiza la pregunta desde otra perspectiva.
Da información útil y señala incertidumbres
cuando existan.

Pregunta:
${question}
`
        };


        // Las 3 respuestas se generan simultáneamente

        const results = await Promise.allSettled([

            openRouter(
                models.model1,
                [
                    {
                        role: "user",
                        content: prompts.model1
                    }
                ],
                session.apiKey
            ),

            openRouter(
                models.model2,
                [
                    {
                        role: "user",
                        content: prompts.model2
                    }
                ],
                session.apiKey
            ),

            openRouter(
                models.model3,
                [
                    {
                        role: "user",
                        content: prompts.model3
                    }
                ],
                session.apiKey
            )

        ]);


        const answers = {

            model1:
                results[0].status === "fulfilled"
                    ? results[0].value
                    : `Error: ${results[0].reason?.message}`,

            model2:
                results[1].status === "fulfilled"
                    ? results[1].value
                    : `Error: ${results[1].reason?.message}`,

            model3:
                results[2].status === "fulfilled"
                    ? results[2].value
                    : `Error: ${results[2].reason?.message}`

        };


        const successful =
            results.filter(
                x => x.status === "fulfilled"
            ).length;


        if (successful === 0) {

            return res.status(500).json({
                error:
                    "Los tres modelos fallaron."
            });

        }


        // ===============================
        // JUEZ
        // ===============================

        const judgePrompt = `
Eres GOD BING JUDGE.

Tu trabajo es combinar las respuestas de
tres modelos diferentes.

PREGUNTA:

${question}


RESPUESTA 1:

${answers.model1}


RESPUESTA 2:

${answers.model2}


RESPUESTA 3:

${answers.model3}


INSTRUCCIONES:

- Compara las tres respuestas.
- Detecta contradicciones.
- Descarta información dudosa.
- Conserva los datos que tengan sentido.
- Produce una única respuesta final.
- No menciones el proceso interno.
- No digas "el modelo 1 dijo".
- Responde directamente al usuario.
- Utiliza Markdown si ayuda a organizar la respuesta.
`;


        let finalAnswer;

        try {

            finalAnswer = await openRouter(
                models.judge,
                [
                    {
                        role: "system",
                        content:
                            "Eres el juez y sintetizador de GOD BING AI."
                    },
                    {
                        role: "user",
                        content: judgePrompt
                    }
                ],
                session.apiKey
            );

        } catch (judgeError) {

            finalAnswer =
                answers.model1 ||
                answers.model2 ||
                answers.model3;

        }


        res.json({

            success: true,

            final: finalAnswer,

            models: {

                model1: {
                    model: models.model1,
                    success:
                        results[0].status === "fulfilled",
                    answer: answers.model1
                },

                model2: {
                    model: models.model2,
                    success:
                        results[1].status === "fulfilled",
                    answer: answers.model2
                },

                model3: {
                    model: models.model3,
                    success:
                        results[2].status === "fulfilled",
                    answer: answers.model3
                },

                judge: {
                    model: models.judge
                }

            }

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

});


app.listen(PORT, () => {

    console.log("");
    console.log("================================");
    console.log("        GOD BING AI");
    console.log("================================");
    console.log(`http://localhost:${PORT}`);
    console.log("================================");

});
