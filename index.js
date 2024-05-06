const express = require("express");
const multer  = require("multer");
const ejs = require("ejs");
const fs = require("fs");
const bp = require("body-parser");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// finding a specific item in array --> existing_uploads.uploads.indexOf(existing_uploads.uploads.find((upload) => upload.name = req.body.name))

const app = express();
app.engine("html", ejs.renderFile);
app.set("view engine", "html");
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(`${__dirname}/public`));

const storage = multer.diskStorage(
    {
        destination: "public/uploads/",
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }
    }
)
const upload = multer({ storage });

const config = JSON.parse(fs.readFileSync("config.json","utf-8"));

// custom middleware
app.use((req, res, next) => {
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
})

app.get("/", (req, res) => {
    const u = JSON.parse(fs.readFileSync("db/uploads.json","utf-8"));
    const f = JSON.parse(fs.readFileSync("db/folders.json","utf-8"));

    res.render("index", {
        name: config.name,
        favicon: config.favicon,
        uploads: JSON.stringify(u.uploads),
        folders: JSON.stringify(f.folders)
    });
})

// uploading files
app.post("/api/upload", upload.single("file"), function (req, res) {
    try {
        let uploads = JSON.parse(fs.readFileSync("db/uploads.json","utf-8"));

        let file_name = req.file.originalname;
        file_name = file_name.split(".")

        uploads.uploads.push({
            type: req.file.mimetype,
            name: file_name[0],
            path: `/uploads/${req.file.originalname}`,
            folder: req.body.folder,
        })

        fs.writeFileSync("db/uploads.json", JSON.stringify(uploads), "utf-8");

        res.redirect("/");
    } catch (e) {
        res.send("A server-side error occured.");
    }
})

// deleting files
app.post("/api/delete", (req, res) => {
    let u = JSON.parse(fs.readFileSync("db/uploads.json","utf-8"));

    u.uploads.forEach((upload) => {
        if (upload.name == req.body.name) {
            fs.unlinkSync(`public/${upload.path}`);

            u.uploads.splice(u.uploads.indexOf(upload), 1);
        }
    });

    fs.writeFileSync("db/uploads.json", JSON.stringify(u), "utf-8");

    res.json({ success: true });
})

// renaming files
app.post("/api/rename-file", (req, res) => {
    if (req.body.new_name != "") {
        let u = JSON.parse(fs.readFileSync("db/uploads.json","utf-8"));

        u.uploads.forEach((upload) => {
            if (upload.name == req.body.name) {
                upload.name = req.body.new_name;
            }
        });

        fs.writeFileSync("db/uploads.json", JSON.stringify(u), "utf-8");
    }

    res.json({ success: true });
});

// renaming folders
app.post("/api/rename-folder", (req, res) => {
    if (req.body.new_name != "") {
        let u = JSON.parse(fs.readFileSync("db/uploads.json","utf-8"));
        let f = JSON.parse(fs.readFileSync("db/folders.json","utf-8"));

        f.folders.forEach((folder, i) => {
            if (folder == req.body.name) {
                f.folders[i] = req.body.new_name;

                // changing all uploads with this folder into the new folder name
                u.uploads.forEach((upload) => {
                    if (upload.folder == req.body.name) {
                        upload.folder = req.body.new_name;
                    }
                });
            }
        });

        fs.writeFileSync("db/folders.json", JSON.stringify(f), "utf-8");
        fs.writeFileSync("db/uploads.json", JSON.stringify(u), "utf-8");
    }
    res.json({ success: true });
});

// creating folders
app.post("/api/create-folder", (req, res) => {
    let f = JSON.parse(fs.readFileSync("db/folders.json","utf-8"));

    if(f.folders.includes(req.body.name) == false) {
        f.folders.push(req.body.name);
        fs.writeFileSync("db/folders.json", JSON.stringify(f), "utf-8");
    }

    res.redirect("/");
})

// moving files
app.post("/api/move-file", (req, res) => {
    let u = JSON.parse(fs.readFileSync("db/uploads.json","utf-8"));

    u.uploads.forEach((upload) => {
        if (upload.name == req.body.name) {
            upload.folder = req.body.folder;
        }
    })

    fs.writeFileSync("db/uploads.json", JSON.stringify(u), "utf-8");

    res.json({ success: true });
})

// logging in with a specific password
app.post("/api/login", (req, res) => {
    if (req.body.password != process.env.password) {
        res.json({ error: "Incorrect password." });
    } else {
        res.cookie("login", process.env.password);
        res.json({ success: true });
    }
})

app.listen(3000, () => {
    console.log(`Server is running on port 3000`);

    if (fs.existsSync("db/folders.json") == false) {
        fs.appendFile("db/folders.json", `{ "folders": [] }`, () => {});
    }
    if (fs.existsSync("db/uploads.json") == false) {
        fs.appendFile("db/uploads.json", `{ "uploads": [] }`, () => {});
    }
})