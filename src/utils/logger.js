const yellow = "\x1b[33m";
const green = "\x1b[32m";
const red = "\x1b[31m";
const blue = "\x1b[34m";
const cyan = "\x1b[36m";
const reset = "\x1b[0m";

function info(message){
    logBuilder(green, "INFO", message);
}

function warn(message){
    logBuilder(yellow, "WARN", message);
}

function error(message){
    logBuilder(red, "ERROR", message);
}

function debug(message){
    logBuilder(cyan, "DEBUG", message);
}

function timestamp(){
    return new Date().toISOString(); // new Date() returns current data and time in local timezone. toISOString() converts it to UTC format.
}

function logBuilder(color, level, message){
    console.log(color + timestamp() + " [" + level + "] " + message + reset);//#1 SINGLE MOST IMPORTANT LINE OF THIS FILE.
}

export { info, warn, error, debug };

/*
Why we need a logger utility?
Till now for every log we are using console.log() which is fine but looks cluttered and not very readable. Also that idea is less expandable.
*/