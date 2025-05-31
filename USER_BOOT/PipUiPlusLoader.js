function specialSubmenu()
{
	// Avoid loading the bulk of the app into memory permanently,
	// and instead emulate flash memory by loading from SD only when needed
	eval(fs.readFile("USER_BOOT/PIP_UI_PLUS/Special.min.js"));
}

function perksSubmenu()
{
	eval(fs.readFile("USER_BOOT/PIP_UI_PLUS/Perks.min.js"));
}

// deletes all properties in an object, renames, and re-inserts them while inserting new properties at specified points
function alterObject(object, renameMap, propertyMap)
{
	for (const entry of Object.entries(object))
	{
		const key = entry[0];
		const value = entry[1];

		delete object[key];
		object[renameMap[key] || key] = value;
		Object.assign(object, propertyMap[key]);
	}
}

alterObject(
	MODEINFO[MODE.STAT].submenu,
	{ "CONNECT": "CONN", "DIAGNOSTICS": "DIAG" },
	{ "STATUS": { "SPECIAL": specialSubmenu, "PERKS": perksSubmenu } },
);