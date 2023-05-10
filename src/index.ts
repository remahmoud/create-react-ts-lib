import ora from "ora";
import fs from "fs-extra";
import path from "path";
import { execa } from "execa";
import { blue, bold, green, red } from "kolorist";
import prompts, { Answers } from "prompts";

const CURRENT_PATH = process.cwd();
const DEFAULT_APP_NAME = "react-lib";
const REPO_URL = "https://github.com/remahmoud/rollup-ts-react-lib";

async function init() {
    let answers: Answers<"libName" | "overwrite" | "pkgName">;
    // app args
    const args = process.argv[2];
    // def
    let target = args ?? DEFAULT_APP_NAME;
    // project name
    const projectName = target === "." ? path.basename(path.resolve()) : target;

    try {
        // questions prompt
        answers = await prompts(
            [
                {
                    type: () => (args ? null : "text"),
                    name: "libName",
                    message: "Library name:",
                    initial: target,
                    onState: (state) => {
                        target =
                            state.value.trim().replace(/\/+$/g, "") ?? target;
                    },
                },
                {
                    type: () => {
                        return !fs.existsSync(target) || isEmpty(target)
                            ? null
                            : "confirm";
                    },
                    name: "overwrite",
                    message: `directory ${red(
                        target
                    )} is not empty. clear files and continue?`,
                },
                {
                    type: () =>
                        isValidProjectName(projectName) ? null : "text",
                    name: "pkgName",
                    message: "Package name:",
                    initial: () => createValidName(projectName),
                    validate: (dir) =>
                        isValidProjectName(dir) || "Invalid package.json name",
                },
            ],
            {
                onCancel: () => {
                    throw new Error(bold(red(`operation cancelled`)));
                },
            }
        );
    } catch (err: any) {
        console.log(err.message);
        return;
    }

    // answers
    const { overwrite, pkgName } = answers;

    // complete path to project folder
    const FULL_PATH = path.join(CURRENT_PATH, target);

    if (overwrite) {
        // clear all files in folder
        clearFiles(FULL_PATH);
    } else {
        // create new folder
        fs.mkdirSync(FULL_PATH, { recursive: true });
    }

    try {
        // play spinner while creating project
        const spinner = ora(bold(blue("Downloading the project structure...")));
        spinner.start();

        // clone template repo
        await execa("git", ["clone", REPO_URL, FULL_PATH], {
            cwd: FULL_PATH,
        });

        // update package.json
        const pkgPath = path.join(FULL_PATH, "package.json");
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        // update name
        pkg.name = pkgName ?? target;
        // write new data to package.json file
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

        // remove .git folder
        fs.rmSync(path.join(FULL_PATH, ".git"), {
            recursive: true,
            force: true,
        });
        // stop spinner
        spinner.stop();
        console.log(bold(green(`${target} created successfully.`)));
    } catch (err: any) {
        console.error(err.message);
        process.exit(1);
    }
}

// check if folder is empty
function isEmpty(dir: string): boolean {
    return fs.readdirSync(dir).length === 0;
}

// clear all files in folder
function clearFiles(dir: string) {
    if (!fs.existsSync(dir)) {
        return;
    }
    fs.emptyDirSync(dir);
}
function isValidProjectName(projectName: string) {
    return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
        projectName
    );
}

function createValidName(name: string) {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\_/g, "-")
        .replace(/\-\-+/g, "-")
        .replace(/\-$/g, "");
}

init().catch((e) => console.log(e));
