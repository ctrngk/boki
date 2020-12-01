import fse from 'fs-extra'
import axios from 'axios'
import mime from 'mime-types'
import fs from 'fs'
const Formidable = require("formidable-serverless")
const jsdom = require("jsdom")
const { JSDOM } = jsdom
import Error from 'next/error'
import assert from "assert";
import {findDoubleCurly, findDoubleCurlyReplace} from '../../utils/handleDoubleCurly'
import {importAPKG} from "../../utils/importAPKG";

const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL

const sqlite3 = require('sqlite3').verbose()

export const config = {
    api: {
        bodyParser: false,
    },
};

export default function uploadFormFiles(req, res) {
    if (req.method === 'POST') {
        return new Promise(async (resolve, reject) => {
            const form = new Formidable.IncomingForm({
                multiples: true,
                keepExtensions: true,
            });

            form
                .on("file", async (name, file) => {
                    const customID = name
                    if (file.name.split('.').pop() === 'apkg') {
                        importAPKG(file, file.name.split('.')[0])
                    } else {
                        // not implemented
                    }
                })
                .on("aborted", () => {
                    reject(res.status(500).send('Aborted'))
                })
                .on("end", () => {
                    resolve(res.status(200).send('done'))
                });

            await form.parse(req)
        });
    }
}
