/**
 * Created by phil on 9/23/17.
 */
import React from 'react';
import Dropdown from 'react-toolbox/lib/dropdown'
import SelectField from 'material-ui/SelectField';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import AddCircle from 'material-ui/svg-icons/content/add-circle';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import AppBar from 'material-ui/AppBar';
import NavigationClose from 'material-ui/svg-icons/navigation/close';
import Sync from 'material-ui/svg-icons/notification/sync';
var injectTapEventPlugin = require("react-tap-event-plugin");
injectTapEventPlugin();
const styles = {
  container: {
    textAlign: 'center',
    paddingTop: 200,
  },
};

const muiTheme = getMuiTheme({

});
export default class DropdownTest extends React.Component {
   constructor(props) {
        super(props);
       this.new_node = props.new_node
       console.log("newnode = " + this.new_node)

    }
    nodes = [
        {value:'pymc3.Normal',label:"normal"},
        {value:'pymc3.Uniform',label:"uniform"},
    ]

  newNode(event){
       console.log("new node!")
      this.new_node(event.target.value)
  }

  render () {
    return (
<MuiThemeProvider muiTheme={muiTheme}>
     <AppBar
          title="Title"
          iconElementLeft={<IconButton><NavigationClose /></IconButton>}
          iconElementRight={ <div>
              <IconButton  tooltip="Compile" onClick={this.props.generate}><Sync /></IconButton>
              <IconMenu
                  onChange = {this.new_node}
                iconButtonElement={<IconButton tooltip="Add Node"><AddCircle /></IconButton>}
                anchorOrigin={{horizontal: 'left', vertical: 'top'}}
                targetOrigin={{horizontal: 'left', vertical: 'top'}}
                maxHeight={272}
                >
          <MenuItem value={'pymc3.Normal'} primaryText="Normal" />
          <MenuItem value={'pymc3.Uniform'} primaryText="Uniform" />
          <MenuItem value={'pymc3.Binomial'} primaryText="Binomial" />
          <MenuItem value={4} primaryText="Poison" />
          <MenuItem value={5} primaryText="Beta" />
          </IconMenu>
</div>}
/>

</MuiThemeProvider>


    );
  }
}

