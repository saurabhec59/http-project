function info(message){
    console.log("[INFO] " + message);
}

function warn(message){
    console.log("[WARN] " + message);
}

function error(message){
    console.log("[ERROR] " + message);
}

function debug(message){
    console.log("[DEBUG] " + message);
}

export { info, warn, error, debug };

/*
Why we need a logger utility?
Till now for every log we are using console.log() which is fine but looks cluttered and not very readable. Also that idea is less expandable.
*/