import {Main} from "./main.js";

(async () => {
    const APP = new Main();
    await APP.Initialize();
})();