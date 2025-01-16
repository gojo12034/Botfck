const { readdirSync, readFileSync, writeFileSync } = require("fs-extra");
const { join, resolve } = require('path')
const { execSync } = require('child_process');
const config = require("./config.json");
const listPackage = JSON.parse(readFileSync('./package.json')).dependencies;
const fs = require("fs");
const login = require("chatbox-fca-remake")
//const login = require('./Meta-Horizon');
const moment = require("moment-timezone");
const logger = require("./utils/log.js");
const chalk = require("chalk");
const { spawn } = require("child_process");
const pkg = require('./package.json');
const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 20; // Increase max listeners
//*const fca = JSON.parse(fs.readFileSync("fca.json", "utf8"));
console.log(chalk.bold.dim(` ${process.env.REPL_SLUG}`.toUpperCase() + `(v${pkg.version})`));
  logger.log(`Getting Started!`, "STARTER");

global.utils = require("./utils");
global.loading = require("./utils/log.js");
global.nodemodule = new Object();
global.config = new Object();
global.configModule = new Object();
global.moduleData = new Array();
global.language = new Object();
global.account = new Object();

/*function startProject() {
    try {
        const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "index.js"], {
            cwd: __dirname,
            stdio: "inherit",
            shell: true
        });

        child.on("close", (codeExit) => {
            if (codeExit !== 0) {
                startProject();
            }
        });

        child.on("error", (error) => {
            console.log(chalk.yellow(``), `An error occurred while starting the child process: ${error}`);
        });
    } catch (error) {
        console.error("An error occurred:", error);
    }
} 

startProject();
*/
global.client = new Object({
  commands: new Map(),
  events: new Map(),
  cooldowns: new Map(),
  eventRegistered: new Array(),
  handleSchedule: new Array(),
  handleReaction: new Array(),
  handleReply: new Array(),
  mainPath: process.cwd(),
  configPath: new String(),
  getTime: function(option) {
    switch (option) {
      case "seconds":
        return `${moment.tz("Asia/Manila").format("ss")}`;
      case "minutes":
        return `${moment.tz("Asia/Manila").format("mm")}`;
      case "hours":
        return `${moment.tz("Asia/Manila").format("HH")}`;
      case "date":
        return `${moment.tz("Asia/Manila").format("DD")}`;
      case "month":
        return `${moment.tz("Asia/Manila").format("MM")}`;
      case "year":
        return `${moment.tz("Asia/Manila").format("YYYY")}`;
      case "fullHour":
        return `${moment.tz("Asia/Manila").format("HH:mm:ss")}`;
      case "fullYear":
        return `${moment.tz("Asia/Manila").format("DD/MM/YYYY")}`;
      case "fullTime":
        return `${moment.tz("Asia/Manila").format("HH:mm:ss DD/MM/YYYY")}`;
    }
  },
  timeStart: Date.now()
});

global.data = new Object({
  threadInfo: new Map(),
  threadData: new Map(),
  userName: new Map(),
  userBanned: new Map(),
  threadBanned: new Map(),
  commandBanned: new Map(),
  threadAllowNSFW: new Array(),
  allUserID: new Array(),
  allCurrenciesID: new Array(),
  allThreadID: new Array()
});

// ────────────────── //
// -- LOAD THEMES -- //
const { getThemeColors } = require("./utils/log");
const { cra, cv, cb } = getThemeColors();
// ────────────────── //

const errorMessages = [];
if (errorMessages.length > 0) {
  console.log("Commands with errors:");
  errorMessages.forEach(({ command, error }) => {
    console.log(`${command}: ${error}`);
  });
}
// ────────────────── //
var configValue;
try {
  global.client.configPath = join(global.client.mainPath, "config.json");
  configValue = require(global.client.configPath);
  logger.loader("Found config.json file!");
} catch (e) {
  return logger.loader('"config.json" file not found."', "error");
}

try {
  for (const key in configValue) global.config[key] = configValue[key];
  logger.loader("Config Loaded!");
} catch (e) {
  return logger.loader("Can't load file config!", "error")
}

for (const property in listPackage) {
  try {
    global.nodemodule[property] = require(property)
  } catch (e) { }
}
const langFile = (readFileSync(`${__dirname}/languages/${global.config.language || "en"}.lang`, {
  encoding: 'utf-8'
})).split(/\r?\n|\r/);
const langData = langFile.filter(item => item.indexOf('#') != 0 && item != '');
for (const item of langData) {
  const getSeparator = item.indexOf('=');
  const itemKey = item.slice(0, getSeparator);
  const itemValue = item.slice(getSeparator + 1, item.length);
  const head = itemKey.slice(0, itemKey.indexOf('.'));
  const key = itemKey.replace(head + '.', '');
  const value = itemValue.replace(/\\n/gi, '\n');
  if (typeof global.language[head] == "undefined") global.language[head] = new Object();
  global.language[head][key] = value;
}

global.getText = function(...args) {
  const langText = global.language;
  if (!langText.hasOwnProperty(args[0])) {
    throw new Error(`${__filename} - Not found key language: ${args[0]}`);
  }
  var text = langText[args[0]][args[1]];
  if (typeof text === 'undefined') {
    throw new Error(`${__filename} - Not found key text: ${args[1]}`);
  }
  for (var i = args.length - 1; i > 0; i--) {
    const regEx = RegExp(`%${i}`, 'g');
    text = text.replace(regEx, args[i + 1]);
  }
  return text;
};

// Invoke bypassAutoBehavior immediately after appState is found
try {
  var appStateFile = resolve(join(global.client.mainPath, config.APPSTATEPATH || "appstate.json"));
  var appState = ((process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER) &&
    (fs.readFileSync(appStateFile, 'utf8'))[0] != "[" && config.encryptSt) ?
    JSON.parse(global.utils.decryptState(fs.readFileSync(appStateFile, 'utf8'),
    (process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER))) : require(appStateFile);

  logger.loader("Found the bot's appstate.");

  // Check and bypass automated behavior before proceeding
  (async () => {
    try {
      console.log("Checking appState for automated behavior...");
      const bypassSuccess = await bypassAutoBehavior(null, appState);
      if (bypassSuccess) {
        console.log("Bypass complete. Renewing appState...");
        await refreshAppState(appState);
        console.log("Loading main functions...");
        onBot();
      } else {
        console.error("Bypass failed. Exiting process...");
        process.exit(1);
      }
    } catch (bypassError) {
      console.error("Error during bypass automated behavior check:", bypassError.message || "Unknown error");
      process.exit(1);
    }
  })();

} catch (e) {
  logger.loader("Can't find the bot's appstate.", "error");
  process.exit(1);
}



async function bypassAutoBehavior(resp, appstate) {
  try {
    console.log("Attempting to bypass automated behavior...");

    const appstateCUser = appstate?.find(i => i.name === 'c_user') || appstate?.find(i => i.name === 'i_user');

    if (!appstateCUser || !appstateCUser.value) {
      throw new Error("c_user or i_user not found in appstate.");
    }

    const UID = appstateCUser.value;
    const FormBypass = {
      av: UID,
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "FBScrapingWarningMutation",
      variables: JSON.stringify({}),
      server_timestamps: true,
      doc_id: 6339492849481770,
    };

    if (resp?.request?.uri?.href?.includes("https://www.facebook.com/checkpoint/")) {
      if (resp.request.uri.href.includes('601051028565049')) {
        const fb_dtsg = utils.getFrom(resp.body, '["DTSGInitData",[],{"token":"', '","');
        const jazoest = utils.getFrom(resp.body, 'jazoest=', '",');
        const lsd = utils.getFrom(resp.body, '["LSD",[],{"token":"', '"}]');
        await utils.post("https://www.facebook.com/api/graphql/", null, {
          ...FormBypass,
          fb_dtsg,
          jazoest,
          lsd,
        }, globalOptions);
        console.log("Automated behavior bypass successful.");
        return true;
      } else {
        console.warn("Bypass condition not met. Proceeding...");
        return true;
      }
    } else {
      console.warn("No checkpoint detected. Proceeding...");
      return true;
    }
  } catch (e) {
    console.error("Error in bypassAutoBehavior:", e);
    return false;
  }
}

async function refreshAppState(api) {
  try {
    console.log("Refreshing appState...");
    const updatedAppState = api.getAppState();

    // Verify appState contains valid tokens
    if (!updatedAppState.find(i => i.name === 'c_user' || i.name === 'i_user')) {
      throw new Error("Invalid appState: Missing c_user or i_user.");
    }

    const appStateFile = resolve(join(global.client.mainPath, config.APPSTATEPATH || "appstate.json"));
    let d = JSON.stringify(updatedAppState, null, 2);

    if ((process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER) && global.config.encryptSt) {
      d = await global.utils.encryptState(d, process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER);
    }
    fs.writeFileSync(appStateFile, d);
    console.log("appState refreshed and saved successfully.");
  } catch (error) {
    console.error("Failed to refresh appState:", error.message || "Unknown error");
    process.exit(1);
  }
}

function onBot() {
  let loginData;

  if (appState === null) {
    loginData = {
      email: config.email,
      password: config.password,
    };
  }

  // Use environment variables for credentials if enabled
  if (config.useEnvForCredentials) {
    loginData = {
      email: process.env[config.email],
      password: process.env[config.password],
    };
  } else {
    loginData = { appState: appState };
  }

  login(loginData, async (err, api) => {
    if (err) {
      console.error(`Login Error: ${err.message || "Unknown error"}`);
      process.exit(1);
    }

    console.log("Login successful. Initializing bot functions...");

    try {
      await refreshAppState(api);
    } catch (refreshError) {
      console.error("Error during appState refresh:", refreshError.message);
      process.exit(1);
    }



function onBot() {
  let loginData;

  if (appState === null) {
    loginData = {
      email: config.email,
      password: config.password,
    };
  }

  // Use environment variables for credentials if enabled
  if (config.useEnvForCredentials) {
    loginData = {
      email: process.env[config.email],
      password: process.env[config.password],
    };
  } else {
    loginData = { appState: appState };
  }

  login(loginData, async (err, api) => {
    if (err) {
      console.error(`Login Error: ${err.message || "Unknown error"}`);
      process.exit(1);
    }

    console.log("Login successful. Initializing bot functions...");


    const custom = require('./custom');
    custom({ api });
    const fbstate = api.getAppState();
    api.setOptions(global.config.FCAOption);

    let d = JSON.stringify(fbstate, null, '\x09');

    const saveAppState = async () => {
      if ((process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER) && global.config.encryptSt) {
        d = await global.utils.encryptState(d, process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER);
        writeFileSync(appStateFile, d);
      } else {
        writeFileSync(appStateFile, d);
      }
    };

    await saveAppState();

    
    global.account.cookie = fbstate.map(i => i = i.key + "=" + i.value).join(";");
    global.client.api = api
    global.config.version = config.version,
      (async () => {
        const commandsPath = `${global.client.mainPath}/modules/commands`;
        const listCommand = readdirSync(commandsPath).filter(command => command.endsWith('.js') && !command.includes('example') && !global.config.commandDisabled.includes(command));
        console.log(cv(`\n` + `──LOADING COMMANDS─●`));
        for (const command of listCommand) {
          try {
            const module = require(`${commandsPath}/${command}`);
            const { config } = module;

            if (!config?.name) {
              try {
                throw new Error(`[ COMMAND ] ${command} command has no name property or empty!`);
              } catch (error) {
                console.log(chalk.red(error.message));
                continue;
              }
            }
            if (!config?.commandCategory) {
              try {
                throw new Error(`[ COMMAND ] ${command} commandCategory is empty!`);
              } catch (error) {
                console.log(chalk.red(error.message));
                continue;
              }
            }

            if (!config?.hasOwnProperty('usePrefix')) {
              console.log(`Command`, chalk.hex("#ff0000")(command) + ` does not have the "usePrefix" property.`);
              continue;
            }

            if (global.client.commands.has(config.name || '')) {
              console.log(chalk.red(`[ COMMAND ] ${chalk.hex("#FFFF00")(command)} Module is already loaded!`));
              continue;
            }
            const { dependencies, envConfig } = config;
            if (dependencies) {
              Object.entries(dependencies).forEach(([reqDependency, dependencyVersion]) => {
                if (listPackage[reqDependency]) return;

                  try {
                    execSync(`npm --package-lock false --save install ${reqDependency}`, {
                      stdio: 'inherit',
                      env: process.env,
                      shell: true,
                      cwd: join(__dirname, 'node_modules')
                    });
                    require.cache = {};
                  } catch (error) {
                    const errorMessage = `[PACKAGE] Failed to install package ${reqDependency} for module`;
                    global.loading.err(chalk.hex('#ff7100')(errorMessage), 'LOADED');
                  }
              });
            }

            if (envConfig) {
              const moduleName = config.name;
              global.configModule[moduleName] = global.configModule[moduleName] || {};
              global.config[moduleName] = global.config[moduleName] || {};
              for (const envConfigKey in envConfig) {
                global.configModule[moduleName][envConfigKey] = global.config[moduleName][envConfigKey] ?? envConfig[envConfigKey];
                global.config[moduleName][envConfigKey] = global.config[moduleName][envConfigKey] ?? envConfig[envConfigKey];
              }
              var configPath = require('./config.json');
              configPath[moduleName] = envConfig;
              writeFileSync(global.client.configPath, JSON.stringify(configPath, null, 4), 'utf-8');
            }


            if (module.onLoad) {
              const moduleData = {
                api: api
              };
              try {
                module.onLoad(moduleData);
              } catch (error) {
                const errorMessage = "Unable to load the onLoad function of the module."
                throw new Error(errorMessage, 'error');
              }
            }

            if (module.handleEvent) global.client.eventRegistered.push(config.name);
            global.client.commands.set(config.name, module);
            try {
              global.loading.log(`${cra(`LOADED`)} ${cb(config.name)} success`, "COMMAND");
            } catch (err) {
              console.error("An error occurred while loading the command:", err);
            }

            console.err
          } catch (error) {
            global.loading.err(`${chalk.hex('#ff7100')(`LOADED`)} ${chalk.hex("#FFFF00")(command)} fail ` + error, "COMMAND");
          }
        }
      })(),

      (async () => {
        const events = readdirSync(join(global.client.mainPath, 'modules/events')).filter(ev => ev.endsWith('.js') && !global.config.eventDisabled.includes(ev));
        console.log(cv(`\n` + `──LOADING EVENTS─●`));
        for (const ev of events) {
          try {
            const event = require(join(global.client.mainPath, 'modules/events', ev));
            const { config, onLoad, run } = event;
            if (!config || !config.name || !run) {
              global.loading.err(`${chalk.hex('#ff7100')(`LOADED`)} ${chalk.hex("#FFFF00")(ev)} Module is not in the correct format. `, "EVENT");
              continue;
            }


            if (errorMessages.length > 0) {
              console.log("Commands with errors:");
              errorMessages.forEach(({ command, error }) => {
                console.log(`${command}: ${error}`);
              });
            }

            if (global.client.events.has(config.name)) {
              global.loading.err(`${chalk.hex('#ff7100')(`LOADED`)} ${chalk.hex("#FFFF00")(ev)} Module is already loaded!`, "EVENT");
              continue;
            }
            if (config.dependencies) {
              const missingDeps = Object.keys(config.dependencies).filter(dep => !global.nodemodule[dep]);
              if (missingDeps.length) {
                const depsToInstall = missingDeps.map(dep => `${dep}${config.dependencies[dep] ? '@' + config.dependencies[dep] : ''}`).join(' ');
                if (depsToInstall) {
                execSync(`npm install --no-package-lock --no-save ${depsToInstall}`, {
                  stdio: 'inherit',
                  env: process.env,
                  shell: true,
                  cwd: join(__dirname, 'node_modules')
                });
                }
                Object.keys(require.cache).forEach(key => delete require.cache[key]);
              }
            }
            if (config.envConfig) {
              const configModule = global.configModule[config.name] || (global.configModule[config.name] = {});
              const configData = global.config[config.name] || (global.config[config.name] = {});
              for (const evt in config.envConfig) {
                configModule[evt] = configData[evt] = config.envConfig[evt] || '';
              }
              writeFileSync(global.client.configPath, JSON.stringify({
                ...require(global.client.configPath),
                [config.name]: config.envConfig
              }, null, 2));
            }
            if (onLoad) {
              const eventData = {
                api: api
              };
              await onLoad(eventData);
            }
            global.client.events.set(config.name, event);
            global.loading.log(`${cra(`LOADED`)} ${cb(config.name)} success`, "EVENT");
          }
          catch (err) {
            global.loading.err(`${chalk.hex("#ff0000")('ERROR!')} ${cb(ev)} failed with error: ${err.message}` + `\n`, "EVENT");
          }
        }
      })();
    console.log(cv(`\n` + `──BOT START─● `));
    global.loading.log(`${cra(`[ SUCCESS ]`)} Loaded ${cb(`${global.client.commands.size}`)} commands and ${cb(`${global.client.events.size}`)} events successfully`, "LOADED");
    global.loading.log(`${cra(`[ TIMESTART ]`)} Launch time: ${((Date.now() - global.client.timeStart) / 1000).toFixed()}s`, "LOADED");
    
    
    
    const listener = require('./includes/listen')({ api });
    global.handleListen = api.listenMqtt(async (error, event) => {
      if (error) {
        if (error.error === 'Not logged in.') {
          logger.log("Your bot account has been logged out!", 'LOGIN');
          return process.exit(1);
        }
        if (error.error === 'Not logged in') {
          logger.log("Your account has been checkpointed, please confirm your account and log in again!", 'CHECKPOINT');
          return process.exit(0);
        }
        console.log(error);
        return process.exit(0);
      }
      return listener(event);
    });
  });
}

// ___END OF EVENT & API USAGE___ //

(async () => {
  try {
    console.log(cv(`\n` + `──DATABASE─●`));
    global.loading.log(`${cra(`[ CONNECT ]`)} Connected to JSON database successfully!`, "DATABASE");
    onBot();
  } catch (error) {
    global.loading.err(`${cra(`[ CONNECT ]`)} Failed to connect to the JSON database: ` + error, "DATABASE");
  }
})();

/* *
This bot was created by me (CATALIZCS) and my brother SPERMLORD. Do not steal my code. (つ ͡ ° ͜ʖ ͡° )つ ✄ ╰⋃╯
This file was modified by me (@YanMaglinte). Do not steal my credits. (つ ͡ ° ͜ʖ ͡° )つ ✄ ╰⋃╯
* */
