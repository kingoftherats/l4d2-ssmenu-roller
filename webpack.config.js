const path = require('path');

module.exports = {
    mode: "production",
    target: "node",
    entry: {
        main: "./src/main.ts",
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: "main.js"
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [
            { 
                test: /\.ts$/,
                loader: "ts-loader"
            }
        ]
    }
};
