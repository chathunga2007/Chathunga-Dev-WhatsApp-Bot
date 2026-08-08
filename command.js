var commands = [];
var replyHandlers = [];

function cmd(info, func) {
    const data = info;
    data.function = func;

    // Default fields
    if (!data.dontAddCommandList) data.dontAddCommandList = false;
    if (!data.desc) data.desc = '';
    if (!data.category) data.category = 'misc';
    if (!data.filename) data.filename = "Not Provided";
    if (!data.fromMe) data.fromMe = false;

    // Register reply-based handler if no pattern and has filter
    if (!data.pattern && typeof data.filter === "function") {
        replyHandlers.push(data);
    } else {
        commands.push(data);
    }

    return data;
}

module.exports = {
    cmd,
    AddCommand: cmd,
    Function: cmd,
    Module: cmd,
    commands,
    replyHandlers,
};
