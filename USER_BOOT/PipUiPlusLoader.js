function specialSubmenu()
{
	eval(fs.readFile("USER_BOOT/PipUiPlus/Special.min.js"));
}

function alterProperties(object, propertyMap, renameMap)
{
	return Object.keys(object).reduce((o, k) =>
		(o[renameMap[k] || k] = object[k], Object.assign(o, propertyMap[k])),
		{}
	);
}

MODEINFO[MODE.STAT].submenu = alterProperties(MODEINFO[MODE.STAT].submenu, { "STATUS": { "SPECIAL": specialSubmenu } }, { "CONNECT": "CONN", "DIAGNOSTICS": "DIAG" });