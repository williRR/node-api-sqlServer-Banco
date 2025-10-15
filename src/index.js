import app from "./app.js";
import { PORT } from "./config.js";

app.listen(PORT);

console.log("Server on port", PORT);
console.log("🔭 Arrancando servicio en puerto", PORT);
