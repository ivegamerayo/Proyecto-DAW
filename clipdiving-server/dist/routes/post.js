"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const autenticacion_1 = require("../middlewares/autenticacion");
const post_model_1 = require("../models/post.model");
const file_system_1 = __importDefault(require("../classes/file-system"));
const postRoutes = (0, express_1.Router)();
const fileSystem = new file_system_1.default();
postRoutes.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let pagina = Number(req.query.pagina) || 1;
    let skip = pagina - 1;
    skip = skip * 10;
    const posts = yield post_model_1.Post.find().sort({ _id: -1 }).skip(skip).limit(10).populate('usuario', '-password').exec();
    res.json({ ok: true, pagina, posts });
}));
postRoutes.post('/', [autenticacion_1.verificaToken], (req, res) => {
    const body = req.body;
    body.usuario = req.usuario._id;
    const videos = fileSystem.sendVidtoPost(req.usuario._id);
    body.vids = videos;
    post_model_1.Post.create(body).then((postDB) => __awaiter(void 0, void 0, void 0, function* () {
        yield postDB.populate('usuario', '-password');
        res.json({ ok: true, post: postDB });
    })).catch(err => {
        res.json(err);
    });
});
postRoutes.post('/upload', [autenticacion_1.verificaToken], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.files) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No se ha subido ningún archivo'
        });
    }
    const file = req.files.video;
    if (!file) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No se ha subido ningún vídeo'
        });
    }
    if (!file.mimetype.includes('video')) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No se ha subido ningún vídeo'
        });
    }
    yield fileSystem.tempVideoSave(file, req.usuario._id);
    res.json({
        ok: true, file: file.mimetype
    });
}));
postRoutes.get('/video/:userid/:vid', (req, res) => {
    const userId = req.params.userid;
    const vid = req.params.vid;
    const pathVideo = fileSystem.getVideoUrl(userId, vid);
    res.sendFile(pathVideo);
});
exports.default = postRoutes;
