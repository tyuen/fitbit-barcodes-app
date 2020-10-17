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
  {name: "EAN/UPC/Code-128", value: "0"},
  {name: "Code-128", value: "1"},
  {name: "Code-39", value: "2"}
];

function showWarning(str) {
  try {
    if(!JSON.parse(str).name) return null;
  } catch(e) {
    return null;
  }
  return (
    <Section title={<Text>Tip: What does &quot;<Text bold>Code too long</Text>&quot; mean?</Text>}>
      <Text>The more characters your barcode has, the more horizontal space is required to display the barcode. When the
      required barcode space exceeds the physical screen space of your device, you will get a &quot;<Text italic>Code too long</Text>&quot; 
      message, because the barcode cannot fit on the screen.</Text>
    </Section>
    )
}

function trim(s) {
  return s && s.replace(/^\s+|\s+$/g, "");
}

function prettyAgo(t) {
  if(t) {
    t = Date.now()/1000 - t;
    if(t < 60) {
      return "Saved now!"
    } else if(t < 60*60) {
      return "Saved " + Math.floor(t/60) + " minute(s) ago";
    } else if(t < 24*60*60) {
      return "Saved " + Math.floor(t/(60*60)) + " hour(s) ago";
    }
  }
  return "";
}

function toObj(json) {
  if(!json) return {};
  try {
    return JSON.parse(json);
  } catch(e) {
    return {};
  }
}

registerSettingsPage(props => {  
  return (
    <Page>
      {showWarning(props.settings.code1)}
      <Toggle settingsKey="bright" label="Increase screen brightness" />

      <Section title="Barcode 1">
        <TextInput settingsKey="name1" title="Name" placeholder="e.g., 7-Eleven" />
        <TextInput settingsKey="code1" label="Barcode" placeholder="e.g., 12345678" />
        <ColorSelect settingsKey="color1" colors={allColors} />
        <Select settingsKey="type1" label="Encoding" options={allTypes} />
      </Section>

      <Section title="Barcode 2">
        <TextInput settingsKey="name2" title="Name"  placeholder="e.g., 7-Eleven" />
        <TextInput settingsKey="code2" title="Barcode" placeholder="e.g., 12345678" />
        <ColorSelect settingsKey="color2" colors={allColors} />
        <Select settingsKey="type2" label="Encoding" options={allTypes} />
      </Section>

      <Section title="Barcode 3">
        <TextInput settingsKey="name3" title="Name"  placeholder="e.g., 7-Eleven" />
        <TextInput settingsKey="code3" title="Barcode" placeholder="e.g., 12345678" />
        <ColorSelect settingsKey="color3" colors={allColors} />
        <Select settingsKey="type3" label="Encoding" options={allTypes} />
      </Section>

      <Section title="Barcode 4">
        <TextInput settingsKey="name4" title="Name"  placeholder="e.g., 7-Eleven" />
        <TextInput settingsKey="code4" title="Barcode" placeholder="e.g., 12345678" />
        <ColorSelect settingsKey="color4" colors={allColors} />
        <Select settingsKey="type4" label="Encoding" options={allTypes} />
      </Section>

      <Section title="Barcode 5">
        <TextInput settingsKey="name5" title="Name"  placeholder="e.g., 7-Eleven" />
        <TextInput settingsKey="code5" title="Barcode" placeholder="e.g., 12345678" />
        <ColorSelect settingsKey="color5" colors={allColors} />
        <Select settingsKey="type5" label="Encoding" options={allTypes} />
      </Section>

      <Section title="Barcode 6">
        <TextInput settingsKey="name6" title="Name"  placeholder="e.g., 7-Eleven" />
        <TextInput settingsKey="code6" title="Barcode" placeholder="e.g., 12345678" />
        <ColorSelect settingsKey="color6" colors={allColors} />
        <Select settingsKey="type6" label="Encoding" options={allTypes} />
      </Section>

      <Section title="Barcode 7">
        <TextInput settingsKey="name7" title="Name"  placeholder="e.g., 7-Eleven" />
        <TextInput settingsKey="code7" title="Barcode" placeholder="e.g., 12345678" />
        <ColorSelect settingsKey="color7" colors={allColors} />
        <Select settingsKey="type7" label="Encoding" options={allTypes} />
      </Section>
      
      <Section description={prettyAgo(props.settings.clickButton)}>
        <Button label="Save" onClick={() => props.settingsStorage.setItem("clickButton", ""+Math.floor(Date.now()/1000)) } />
      </Section>
    </Page>
  );
});
