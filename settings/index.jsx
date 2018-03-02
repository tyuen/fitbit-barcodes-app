var allColors = [
  {color: "#FF4949"},  //red
  {color: "#FEB300"},  //orange
  {color: "#DAD700"},  //yellow
  {color: "#25FF86"},  //lime
  {color: "#12D612"},  //green
  {color: "#6FD4ED"},  //light blue
  {color: "#535BFF"},  //blue
  {color: "#FF40FF"},  //purple
  {color: "#C6643E"},  //brown
  {color: "#808080"}  //grey
];

var allTypes = [
  {name: "Auto-Detect", value: "0"},
  {name: "Code-128", value: "1"},
  {name: "Code-39", value: "2"}
];

function getLen(str) {
  try {
    str = JSON.parse(str).name;
  } catch(e) {
    return null;
  }
  let n = 4;
  if(str.length < 4 || /[^0-9]/.test(str)) {
    for(let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i) - 32;
      if(c < 0 || c > 94) return "Warning: Barcode has invalid letters";
      n++;
    }
  } else {
    let len = str.length;
    if(len % 2 === 1) len--;
    for(let i = 0; i < len; i += 2) n++;
    if(len < str.length) n += 2;
  }
  return n > 15 ? "Warning: Barcode is "+n+" units, which exceeds 15 units." : null;
}

registerSettingsPage(props => {
  return (
    <Page>
      <Section title="Barcode 1" description={getLen(props.settings.code1)}>
        <TextInput settingsKey="name1" title="Name" placeholder="e.g., 7-Eleven" />
        <TextInput settingsKey="code1" label="Barcode" placeholder="e.g., 12345678" />
        <ColorSelect settingsKey="color1" colors={allColors} />
        <Select settingsKey="type1" label="Encoding" options={allTypes} />
      </Section>

      <Section title="Barcode 2" description={getLen(props.settings.code2)}>
        <TextInput settingsKey="name2" title="Name"  placeholder="e.g., 7-Eleven" />
        <TextInput settingsKey="code2" title="Barcode" placeholder="e.g., 12345678" />
        <ColorSelect settingsKey="color2" colors={allColors} />
        <Select settingsKey="type2" label="Encoding" options={allTypes} />
      </Section>

      <Section title="Barcode 3" description={getLen(props.settings.code3)}>
        <TextInput settingsKey="name3" title="Name"  placeholder="e.g., 7-Eleven" />
        <TextInput settingsKey="code3" title="Barcode" placeholder="e.g., 12345678" />
        <ColorSelect settingsKey="color3" colors={allColors} />
        <Select settingsKey="type3" label="Encoding" options={allTypes} />
      </Section>

      <Section title="Barcode 4" description={getLen(props.settings.code4)}>
        <TextInput settingsKey="name4" title="Name"  placeholder="e.g., 7-Eleven" />
        <TextInput settingsKey="code4" title="Barcode" placeholder="e.g., 12345678" />
        <ColorSelect settingsKey="color4" colors={allColors} />
        <Select settingsKey="type4" label="Encoding" options={allTypes} />
      </Section>

      <Section title="Barcode 5" description={getLen(props.settings.code5)}>
        <TextInput settingsKey="name5" title="Name"  placeholder="e.g., 7-Eleven" />
        <TextInput settingsKey="code5" title="Barcode" placeholder="e.g., 12345678" />
        <ColorSelect settingsKey="color5" colors={allColors} />
        <Select settingsKey="type5" label="Encoding" options={allTypes} />
      </Section>
    </Page>
  );
});
