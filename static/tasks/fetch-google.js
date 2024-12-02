import fs from "fs";
import archieml from "archieml";
import docs from "../google.config.js";
import csv from 'csvtojson';

const CWD = process.cwd();

const fetchGoogle = async ({ id, gid }) => {
    console.log(`fetching...${id}`);

    const base = "https://docs.google.com";
    const post = gid
        ? `spreadsheets/u/1/d/${id}/export?format=csv&id=${id}&gid=${gid}`
        : `document/d/${id}/export?format=txt`;
    const url = `${base}/${post}`;

    try {
        const response = await fetch(url);
        const text = await response.text();

        if (gid) return text;

        const parsed = archieml.load(text);
        const str = JSON.stringify(parsed);
        return str;
    } catch (err) {
        throw new Error(err);
    }
};

async function makeJSON(f) {
    const colParser = {
        'colors': (item) => processColumn(item),
        'labels': (item) => processColumn(item)
    };

    function processColumn(item) {
        if (item) {
            try {
                // If it's a valid JSON array, process each element
                return JSON.parse(item).map(el => cleanString(el));
            } catch (e) {
                // If it's not a valid JSON array, assume it's a comma-separated list
                return item.split(',').map(el => cleanString(el));
            }
        } else {
            return null;
        }
    }

    function cleanString(str) {
        // Remove all symbols and punctuation, and trim extra spaces
        return str.trim().replace(/^["\\]+|["\\]+$/g, '').replace("[\"","").replace("\"]","").replace("[","").replace("]","");
    }

    const checkType = (item) => {
        // Check if item is a number
        if (!isNaN(item)) {
            return parseFloat(item);
        }
        // Check if item looks like an array (e.g., '["item1","item2"]')
        if (item.startsWith('[') && item.endsWith(']')) {
            try {
                // Correctly parse the stringified array
                return JSON.parse(item.replace(/\\'/g, "'"));
            } catch (e) {
                return item; // Return the item as is if parsing fails
            }
        }
        return item; // Return the item as is for other cases
    };

    if (f.endsWith('.csv')) {
        try {
            const jsonArray = await csv({
                colParser,
                checkType
            }).fromFile(f);

            // Return the array of objects directly
            return JSON.stringify(jsonArray);
        } catch (error) {
            console.error("Error converting CSV to JSON:", error);
            throw error;
        }
    }
}

(async () => {
    for (let d of docs) {
        try {
            const str = await fetchGoogle(d);
            const file = `${CWD}/${d.filepath}`;
            fs.writeFileSync(file, str);
            if (file.indexOf("csv") != -1) {
                const jsonStr = await makeJSON(file);
                fs.writeFileSync(file.replace("csv", "json"), jsonStr);
            }
        } catch (err) {
            console.log(err);
        }
    }
})();
