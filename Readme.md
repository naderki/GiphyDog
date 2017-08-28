# GiphyDog: GIF fetching bot

#### **Description:**  
Creates a web server that fetches random GIFs from the Giphy service!

#### **Features:**
 * Web server debug page :+1:
   * Displays working directory
   * That's it! (so far)
 * Command line args
   * Use --debug=1 to enable debugging
   * Use --term to set your search tag
 * Logging!!
 * package.json (wow!)
 * Caching and encryption

#### **TODO List:**
* display meta data from the YAML file below the gif
* Create admin page
    * Database usage for authentication
    * On/off button

-----
**Technologies:**
* ~~WebRTC~~
* ~~Express~~
* ~~Bootstrap~~
* ~~jQuery~~
* ~~CSS/HTML~~
* ~~Node~~


-----
#### **Done:**
* ~~Look into UI framework~~
    * React
    * Angular
    * ~~express/bootstrap~~
* ~~Implement JS-Yaml~~
    * ~~Store meta data for corresponding cache file as yaml~~
* ~~JSHint or **ESLint**~~
* ~~Break code into at least 1 module~~
* ~~Encrypt cached files using node crypto~~
* ~~Cache called images~~

* ~~Command line arguments using yargs~~
* ~~Switch to HTTPAgent to allow for reusing of connections~~
* ~~Event listening~~
  * ~~Node API doc events~~
  * ~~Log errors and client information~~
* ~~Logging using Bunyan~~
	* ~~Output to console~~
	* ~~Output to file~~
* ~~Package.json with ```npm install``` support~~
* ~~Create Readme.md~~
* ~~Streams~~
  * ~~Events for read streams~~
  * ~~Transform streams~~
* ~~Compact functions~~
* ~~Create a web interface~~
    * ~~web form to grab search term~~
	* ~~Display gif in frame~~
	    * ~~Create frame~~
    * ~~Use HTML/CSS to frame content correctly~~

#### Running the script

Give it the ol' ```npm install``` and then try some of these nifty commands!

__Run the code using the following commands:__  
Without log output formatting:
```
node giphydog.js --term=funny --debug=1
```

With log output formatting:
```
node giphydog.js --term=funny --debug=1 | ./node_modules/bunyan/bin/bunyan
```

#### Dependencies

 * [bunyan](https://github.com/trentm/node-bunyan)
 * [yargs](https://github.com/yargs/yargs)
 * [giphy-api](https://www.npmjs.com/package/giphy-api)
 * js-yaml
 * express

