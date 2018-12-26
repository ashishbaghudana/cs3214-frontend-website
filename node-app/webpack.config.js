const HtmlWebpackPlugin = require('html-webpack-plugin'); //installed via npm
const webpack = require('webpack'); //to access built-in plugins
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


const config = {
    entry: './src/app/app.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'app.bundle.js'
    },
    module:
        {
            rules: [{
                test: /\.less$/,
                use: ExtractTextPlugin.extract({
                    use: [{
                        loader: "css-loader"
                    }, {
                        loader: "less-loader"
                    }],
                    // use style-loader in development
                    fallback: "style-loader"
                })
            },
                {
                    test: /\.html$/,
                    loader: 'file-loader',
                    options: {
                        outputPath: 'assets/'
                    }
                },
                {
                    test: /\.css$/, use: ExtractTextPlugin.extract({
                        fallback: 'style-loader', use: 'css-loader',
                    })
                },
                {
                    test: /\.scss$/, use: ExtractTextPlugin.extract({
                        fallback: 'style-loader', use: 'css-loader!postcss-loader!sass-loader',
                    })
                },

                {
                    test: /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                    // Limiting the size of the woff fonts breaks font-awesome ONLY for the extract text plugin
                    // use: "url?limit=10000"
                    use: 'url-loader',
                },
                {
                    test: /\.(ttf|eot|svg)(\?[\s\S]+)?$/,
                    loader: 'file-loader',
                    options: {
                        outputPath: 'assets/'
                    }
                },
                {
                    test: /\.(jpg|png|svg|bmp)$/,
                    loader: 'file-loader',
                    options: {
                        name: '[path][name].[ext]',
                        context: 'src/'
                    },
                    include:[
                        path.resolve(__dirname, 'src/images')
                    ]
                }
            ],
            loaders: [

                {test: /\.html$/, loader: 'ng-cache-loader?requireAngular|prefix=[dir]/[dir]'},
            ]
        },
    plugins: [
        new UglifyJsPlugin({
            cache: true,
            parallel: true,
            uglifyOptions:{
                mangle: false,
            }
        }),
        //new BundleAnalyzerPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"'
        }),
        new HardSourceWebpackPlugin(),
        new ExtractTextPlugin("styles.css"),
        new HtmlWebpackPlugin(
            {
                ngApp: 'autograder',
                title: 'CS3214 Computer Systems',
                template: './src/index.ejs',
                inject: 'head',
                /*minify: {
                    collapseWhitespace: true,
                    conservativeCollapse: true,
                    minifyCSS: true,
                    minifyJS: true
                }*/
            }),
        new CleanWebpackPlugin(['dist']),
        new webpack.ProvidePlugin({
            jQuery: 'jquery',
            $: 'jquery',
            jquery: 'jquery',
            'window.jQuery': 'jquery'
        }),

        new CopyWebpackPlugin([
            // copy in the exercise files
            {from: 'src/exercises/exercise_files', to: 'exercises'},
            // copy in the project files
            {from: 'src/projects/project_files', to: 'projects'},
            // copy lectures
            {from: 'src/lectures', to: 'lectures'},
            // copy documents
            {from: 'src/documents', to: 'documents'},
            // copy the htaccess to the dist
            {from: '.htaccess', to: ''}
        ]),
    ]

};

module.exports = config;
