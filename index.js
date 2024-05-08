const express = require("express");
const multer  = require("multer");
const ejs = require("ejs");
const fs = require("fs");
const bp = require("body-parser");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
app.engine("html", ejs.renderFile);
app.set("view engine", "html");
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(`${__dirname}/public`));

const storage = multer.diskStorage(
    {
        destination: "public/files/",
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }
    }
)
const upload = multer({ storage });

const config = JSON.parse(fs.readFileSync("config.json","utf-8"));

// custom middleware
app.use((req, res, next) => {
    if (config.protected == true) {
        if (req.url != "/api/login") {
            if (!req.cookies || req.cookies.login != process.env.password) {
                res.render("login", {
                    name: config.name,
                    favicon: config.favicon
                })
            } else {
                next();
            }
        } else {
            next();
        }
    } else {
        next();
    }
})

app.get("/", (req, res) => {
    let fi = JSON.parse(fs.readFileSync("db/files.json","utf-8"));
    let fo = JSON.parse(fs.readFileSync("db/folders.json","utf-8"));

    res.render("index", {
        name: config.name,
        favicon: config.favicon,
        files: JSON.stringify(fi.files.reverse()),
        folders: JSON.stringify(fo.folders.reverse())
    });
});

app.get("/f/:file", (req, res) => {
    let fi = JSON.parse(fs.readFileSync("db/files.json","utf-8"));
    let file = fi.files.find(find_file);

    function find_file(name) {
        return name.original == req.params.file;
    }

    res.render("file", {
        name: config.name,
        favicon: config.favicon,
        file: JSON.stringify(file)
    });
});

// uploading files
app.post("/api/upload", upload.single("file"), function (req, res) {
    try {
        let fi = JSON.parse(fs.readFileSync("db/files.json","utf-8"));

        let file_name = req.file.originalname;
        file_name = file_name.split(".")

        fi.files.push({
            type: req.file.mimetype,
            name: file_name[0],
            original: req.file.originalname,
            path: `/f/${req.file.originalname}`,
            folder: req.body.folder,
        })

        fs.writeFileSync("db/files.json", JSON.stringify(fi), "utf-8");

        res.redirect("/");
    } catch (e) {
        res.send("A server-side error occured.");
    }
});

// deleting files
app.post("/api/delete-file", (req, res) => {
    let fi = JSON.parse(fs.readFileSync("db/files.json","utf-8"));

    fi.files.forEach((file) => {
        if (file.name == req.body.name) {
            fs.unlinkSync(`public/files/${file.original}`);

            fi.files.splice(fi.files.indexOf(file), 1);
        }
    });

    fs.writeFileSync("db/files.json", JSON.stringify(fi), "utf-8");

    res.json({ success: true });
});

// deleting folders
app.post("/api/delete-folder", (req, res) => {
    let fi = JSON.parse(fs.readFileSync("db/files.json","utf-8"));
    let fo = JSON.parse(fs.readFileSync("db/folders.json","utf-8"));

    fo.folders.forEach((folder) => {
        if (folder.name == req.body.name) {
            fi.files.forEach((file) => {
                if (file.folder == req.body.name) {
                    fs.unlinkSync(`public/files/${file.original}`);
                    fi.files.splice(fi.files.indexOf(file), 1);
                }
            });

            fo.folders.splice(fo.folders.indexOf(folder), 1);
        }
    });

    fs.writeFileSync("db/files.json", JSON.stringify(fi), "utf-8");
    fs.writeFileSync("db/folders.json", JSON.stringify(fo), "utf-8");

    res.json({ success: true });
});

// renaming files
app.post("/api/rename-file", (req, res) => {
    if (req.body.new_name != "") {
        let fi = JSON.parse(fs.readFileSync("db/files.json","utf-8"));

        fi.files.forEach((file) => {
            if (file.name == req.body.name) {
                file.name = req.body.new_name;
            }
        });

        fs.writeFileSync("db/files.json", JSON.stringify(fi), "utf-8");
    }

    res.json({ success: true });
});

// renaming folders
app.post("/api/rename-folder", (req, res) => {
    if (req.body.new_name != "") {
        let fi = JSON.parse(fs.readFileSync("db/files.json","utf-8"));
        let fo = JSON.parse(fs.readFileSync("db/folders.json","utf-8"));

        fo.folders.forEach((folder, i) => {
            if (folder.name == req.body.name) {
                fo.folders[i].name = req.body.new_name;

                // changing all files with this folder into the new folder name
                fi.files.forEach((file) => {
                    if (file.folder == req.body.name) {
                        file.folder = req.body.new_name;
                    }
                });
            }
        });

        fs.writeFileSync("db/folders.json", JSON.stringify(fo), "utf-8");
        fs.writeFileSync("db/files.json", JSON.stringify(fi), "utf-8");
    }
    res.json({ success: true });
});

// creating folders
app.post("/api/create-folder", (req, res) => {
    let fo = JSON.parse(fs.readFileSync("db/folders.json","utf-8"));

    if(fo.folders.includes(req.body.name) == false) {
        fo.folders.push({ name: req.body.name, color: "#c9c8c8" });
        fs.writeFileSync("db/folders.json", JSON.stringify(fo), "utf-8");
    }

    res.redirect("/");
});

// change folder color
app.post("/api/change-folder-color", (req, res) => {
    let fo = JSON.parse(fs.readFileSync("db/folders.json","utf-8"));

    fo.folders.forEach((folder, i) => {
        if (folder.name == req.body.name) {
            fo.folders[i].color = req.body.color;
        }
    });

    fs.writeFileSync("db/folders.json", JSON.stringify(fo), "utf-8");

    res.json({ success: true });
})

// moving files
app.post("/api/move-file", (req, res) => {
    let fi = JSON.parse(fs.readFileSync("db/files.json","utf-8"));

    fi.files.forEach((file) => {
        if (file.name == req.body.name) {
            file.folder = req.body.folder;
        }
    });

    fs.writeFileSync("db/files.json", JSON.stringify(fi), "utf-8");

    res.json({ success: true });
});

// logging in with a specific password
app.post("/api/login", (req, res) => {
    if (req.body.password != process.env.password) {
        res.json({ error: "Incorrect password." });
    } else {
        res.cookie("login", process.env.password);
        res.json({ success: true });
    }
});

app.listen(3000, () => {
    console.log(`Server is running on port 3000`);

    if (fs.existsSync("db/folders.json") == false) {
        fs.appendFile("db/folders.json", `{ "folders": [] }`, () => {});
    }
    if (fs.existsSync("db/files.json") == false) {
        fs.appendFile("db/files.json", `{ "files": [] }`, () => {});
    }
});