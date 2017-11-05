/**
 * Created by phil on 9/23/17.
 */
import React from 'react';

import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import AddCircle from 'material-ui/svg-icons/content/add-circle';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Divider from 'material-ui/Divider';
import Subheader from 'material-ui/Subheader';
import AppBar from 'material-ui/AppBar';
import NavigationClose from 'material-ui/svg-icons/navigation/close';
import Sync from 'material-ui/svg-icons/notification/sync';
import Avatar from 'material-ui/Avatar';
var injectTapEventPlugin = require("react-tap-event-plugin");
injectTapEventPlugin();


const muiTheme = getMuiTheme({

});
export default class MenuBar extends React.Component {
   constructor(props) {
        super(props);
       this.new_node = props.new_node;
        this.node_types = props.node_types;
    }

  newNode(event){
      this.new_node(event.target.value)
  }

  render () {
    return (
<MuiThemeProvider muiTheme={muiTheme}>
     <AppBar
          title="DAG"
          iconElementLeft={<IconButton><NavigationClose /></IconButton>}
          iconElementRight={ <div>
              <IconButton  tooltip="Compile" onClick={this.props.generate}><Sync /></IconButton>
              <IconMenu
                  onChange = {this.new_node}
                iconButtonElement={<IconButton tooltip="Add Node"><AddCircle /></IconButton>}
                anchorOrigin={{horizontal: 'left', vertical: 'top'}}
                targetOrigin={{horizontal: 'left', vertical: 'top'}}
                maxHeight={400}
                >
                  <Subheader>Distributions</Subheader>
                  {Object.keys(this.node_types).map((key) => {
						return (

                            <MenuItem value={key} primaryText={key}  rightAvatar={
        <Avatar
            color={'grey'}
            backgroundColor={'white'}
          size={30}
        >
            {this.node_types[key].module.split(".")[2]}
        </Avatar>
      }>    </MenuItem>
						)

					})}
          <MenuItem value={'normal'} primaryText="Normal" />
          <MenuItem value={'uniform'} primaryText="Uniform" />
          <MenuItem value={'binomial'} primaryText="Binomial" />
          <MenuItem value={'poisson'} primaryText="Poison" />
          <MenuItem value={'beta'} primaryText="Beta" />
                  <Divider />
                      <Subheader>Deterministics</Subheader>
                  <MenuItem value={'product'} primaryText="Product" />
                  <MenuItem value={'sum'} primaryText="Sum" />
                  <MenuItem value={'quotient'} primaryText="Quotient" />
                  <MenuItem value={'subtract'} primaryText="Subtract" />


          </IconMenu>
</div>}
/>

</MuiThemeProvider>


    );
  }
}

