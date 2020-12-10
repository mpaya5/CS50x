const localize = (keyOrInfo, message) => {
    return message;
};

// We need to make it work with both our and vscode loaders
if (typeof module !== 'undefined') {
    module.exports = {localize};
} else if (typeof define !== 'undefined') {
    define('vs/nls', {localize});
}