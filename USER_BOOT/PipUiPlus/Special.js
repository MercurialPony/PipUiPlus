{

const mod = (n, d) => (n % d + d) % d; // we need to do this since js doesn't have a normal modulo operator

const wrap = (value, min, max) => mod(value - min, max - min + 1) + min; // wrap values outside of the range to the opposite side

class Menu // This is essentially the default E.showMenu, but deobfuscated, made more flexible, more efficient, and with extra features on top!
{
	constructor(options, rows)
	{
		this.rows = rows;

		this.options = options = Object.assign({ x1: 10, x2: -20, y1: 0, y2: -1, compact: false }, options);
		options.x1 = mod(options.x1, bC.getWidth()); // modulo will wrap negative coords nicely
		options.x2 = mod(options.x2, bC.getWidth()); // e.g. we get 'width - x' for negative coords
		options.y1 = mod(options.y1, bC.getHeight());
		options.y2 = mod(options.y2, bC.getHeight());

		this.selectedIndex = 0;
		this.isEditing = false;
	}

	get selectedRow() { return this.rows[this.selectedIndex] }

	draw()
	{
		bC.reset();

		if (this.options.compact) bC.setFontMonofonto16();
		else bC.setFontMonofonto18();

		const x1 = this.options.x1;
		const x2 = this.options.x2;
		const y1 = this.options.y1;
		const y2 = this.options.y2;
		const cx = (x2 + x1) >> 1;

		const arrowSize = 10;
		const rowHeight = this.options.compact ? 25 : 27;
		const titlePadY = (rowHeight - bC.getFontHeight()) >> 1;

		const rowCountOnScreen = Math.min((y2 - y1 - arrowSize * 2) / rowHeight, this.rows.length) | 0; // OR 0 to calculate floor
		const firstRowIndex = E.clip(this.selectedIndex - (rowCountOnScreen >> 1), 0, this.rows.length - rowCountOnScreen); // left bit shift to divide by 2^n and floor in one operation

		// draw up arrow if the first row is no longer on screen
		bC.setColor(firstRowIndex > 0 ? 3 : 0).fillPoly([
			cx - arrowSize, y1 + arrowSize,
			cx + arrowSize, y1 + arrowSize,
			cx			  , y1
		]);

		for (let rowIndexOnScreen = 0; rowIndexOnScreen < rowCountOnScreen; ++rowIndexOnScreen)
		{
			const rowIndex = firstRowIndex + rowIndexOnScreen;
			const row = this.rows[rowIndex];

			const isSelected = rowIndex == this.selectedIndex;
			const drawHighlight = isSelected && !this.isEditing;

			const rowY1 = y1 + arrowSize + rowHeight * rowIndexOnScreen;
			const rowY2 = rowY1 + rowHeight - 1;

			// draw row
			bC.setBgColor(drawHighlight ? 3 : 0)
			  .clearRect(x1, rowY1, x2, rowY2) // draw highlight
			  .setColor(drawHighlight ? 0 : 3)
			  .setFontAlign(-1, -1)
			  .drawString(row.title, x1 + 20, rowY1 + titlePadY); // draw title

			if (row.value == null) continue; // null OR undefined

			const rowValue = row.format ? row.format(row.value) : row.value;
			const isEditing = isSelected && this.isEditing;

			const arrowsWidth = 24;
			const arrowsHeight = 10;
			const valueX = isEditing ? x2 - arrowsWidth : x2;
			const valuePadX = 3;

			if (isEditing)
			{
				bC.setBgColor(3) // draw edit box
				  .clearRect(valueX - bC.stringWidth(rowValue) - valuePadX * 2, rowY1, x2, rowY2) // draw highlight
				  .setColor(0)
				  .drawImage( // draw up/down arrows
						/*
						001000000000 
						011100000000
						111110011111
						000000001110
						000000000100 0000 (+pad)
						*/
						{ width: arrowsWidth >> 1, height: arrowsHeight >> 1, buffer: "\x20\x07\x00\xf9\xf0\x0e\x00\x40", transparent: 0 },
						valueX, rowY1 + ((rowHeight - arrowsHeight) >> 1),
						{ scale: 2 }
				);
			}

			// draw value text
			bC.setFontAlign(1, -1).drawString(rowValue.toString(), valueX - valuePadX, rowY1 + titlePadY);
		}

		const by = y1 + arrowSize + rowHeight * rowCountOnScreen;

		// draw down arrow if the last row is not on screen
		bC.setColor(firstRowIndex + rowCountOnScreen < this.rows.length ? 3 : 0).fillPoly([
			cx - arrowSize, by,
			cx + arrowSize, by,
			cx			  , by + arrowSize
		]).flip();
	}

	move(delta)
	{
		if (this.isEditing) // move value
		{
			const row = this.selectedRow;
			const lastValue = row.value;

			row.value -= delta * (row.step || 1);

			if (row.wrap) row.value = wrap(row.value, row.min, row.max);
			else 		  row.value = E.clip(row.value, row.min, row.max);

			if (row.value == lastValue) return;
			if (row.onchange) row.onchange(row.value, -delta);
		}
		else // move selection
		{
			const lastSelectedIndex = this.selectedIndex;
			this.selectedIndex = E.clip(this.selectedIndex + delta, 0, this.rows.length - 1);
			if (lastSelectedIndex == this.selectedIndex) return;

			if (this.selectedRow.onselect) this.selectedRow.onselect(this);
			Pip.knob1Click(delta);
		}

		this.draw()
	}

	click()
	{
		const row = this.selectedRow;

		Pip.audioStartVar(Pip.audioBuiltin("OK"));

		const valueType = (typeof row.value)[0];
		if (valueType == "n") this.isEditing = !this.isEditing; // number
		else
		{
			if (valueType == "b") row.value = !row.value; // boolean
			if (row.onchange)	  row.onchange(row.value);
		}

		this.draw();
	}

	handleKnob1(delta)
	{
		delta ? this.move(-delta) : this.click();
	}

	show()
	{
		if (Pip.removeSubmenu) Pip.removeSubmenu();
		
		bC.clear(1);
		if (this.selectedRow.onselect) this.selectedRow.onselect(this); // TODO: I don't like this
		this.draw();

		const handler = this.handleKnob1.bind(this);
		Pip.addListener("knob1", handler);
		Pip.removeSubmenu = () =>
		{
			Pip.removeListener("knob1", handler);
			Pip.videoStop();
		};
	}
}

class Entry
{
	constructor(path, data)
	{
		this.path = path;
		this.title = data.t;
	}

	read()
	{
		return JSON.parse(fs.readFile(this.path));
	}

	write(data)
	{
		fs.writeFile(this.path, JSON.stringify(data));
	}

	onselect(menu)
	{
		const data = this.read();

		const descriptionX = menu.options.x2 + 10;
		const descriptionY = 130;
		const descriptionLength = bC.getWidth() - descriptionX;

		const imageLeftMargin = menu.options.x2;
		const imageRightMargin = bC.getWidth() - 10;
		const imageBottomMargin = descriptionY - 10;

		const videoOffsetX = 40; // videos seem to be offset differently for some reason...
		const videoOffsetY = 65; // these values were obtained by pure tireless trial and error o_o

		Pip.videoStop();
		Pip.videoStart(data.f, {
			x: videoOffsetX + ((imageLeftMargin + imageRightMargin - data.w) >> 1), // centered horizontally
			y: videoOffsetY + Math.max(0, imageBottomMargin - data.h), // aligned to bottom vertically (but never outside of bounds)
			repeat: true
		});

		bC.reset()
		  .setFont("Vector", 12)
		  .clearRect(descriptionX, descriptionY, bC.getWidth(), bC.getHeight())
		  .drawString(bC.wrapString(data.d, descriptionLength).join("\n"), descriptionX, descriptionY);
	}
}

class NumericEntry extends Entry
{
	constructor(path, data)
	{
		super(path, data);
		this.value = data.v;
	}

	onchange(value)
	{
		const data = this.read();
		data.v = value;
		this.write(data);
	}
}

class SpecialEntry extends NumericEntry
{
	constructor(path, data)
	{
		super(path, data);
		this.min = 1;
		this.max = 10;
	}
}

const SPECIAL_ASSET_DIRECTORY = "USER_BOOT/PipUiPlus/Special";

new Menu({ x2: 180, compact: true }, fs
	.readdir(SPECIAL_ASSET_DIRECTORY)
	.filter(n => n.endsWith(".json"))
	.map(n => SPECIAL_ASSET_DIRECTORY + "/" + n)
	.map(p => new SpecialEntry(p, JSON.parse(fs.readFile(p))))
).show();

}