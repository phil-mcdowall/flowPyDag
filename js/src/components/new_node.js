

/**
 * Created by phil on 9/23/17.
 */
import React from 'react';

import Menu, { MenuItem } from 'material-ui/Menu';
import IconButton from 'material-ui/IconButton';
import Divider from 'material-ui/Divider';
import AppBar from 'material-ui/AppBar';
import Avatar from 'material-ui/Avatar';
import Button from 'material-ui/Button';
import ChartHistogramIcon from 'mdi-react/ChartHistogramIcon';
import ChartLineIcon from 'mdi-react/ChartLineIcon';
import CodeBracesIcon from 'mdi-react/CodeBracesIcon';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import Drawer from 'material-ui/Drawer';
import List, { ListItem, ListItemText,ListItemSecondaryAction,ListSubheader,  ListItemIcon } from 'material-ui/List';
import Switch from 'material-ui/Switch'
import Typography from 'material-ui/Typography';

class SwitchListSecondary extends React.Component {
  state = {
    checked: ['wifi'],
  };

  handleToggle = value => () => {
    const { checked } = this.state;
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    this.setState({
      checked: newChecked,
    });
  };

  render() {
    const { classes } = this.props;

    return (
      <div>
        <List subheader={<ListSubheader>Settings</ListSubheader>}>
          <ListItem>
            <ListItemText primary="Wi-Fi" />
            <ListItemSecondaryAction>
              <Switch
                onClick={this.handleToggle('wifi')}
                checked={this.state.checked.indexOf('wifi') !== -1}
              />
            </ListItemSecondaryAction>
          </ListItem>
          <ListItem>

            <ListItemText primary="Bluetooth" />
            <ListItemSecondaryAction>
              <Switch
                onClick={this.handleToggle('bluetooth')}
                checked={this.state.checked.indexOf('bluetooth') !== -1}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </div>
    );
  }
}
const styles = theme => ({
  card: {
    minWidth: 275,
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  title: {
    marginBottom: 16,
    fontSize: 14,
    color: theme.palette.text.secondary,
  },
  pos: {
    marginBottom: 12,
    color: theme.palette.text.secondary,
  },
    list:{
      maxHeight: '100px'
    }
});

class DistributionIcon extends React.Component {

       constructor(props) {
        super(props);
        this.icon_type = props.icon_type;
    }
    render(){
           console.log(this.icon_type);
           switch(this.icon_type){
               case 'pymc3.distributions.continuous':
                return <ChartLineIcon/>;
               case 'theano.tensor':
                   return <CodeBracesIcon/>;
               default:
                   return <ChartHistogramIcon/>}

       }
}


class TemporaryDrawer extends React.Component {

       constructor(props) {
        super(props);
       this.new_node = props.new_node;
        this.node_types = props.node_types;
    }

  newNode(key){
      this.new_node(key)
  }

  state = {
    left: false,
  };

  toggleDrawer = (side, open) => () => {
    this.setState({
      left: open,
    });
  };


  render() {
    const { classes } = this.props;

    var distributions = [];
    var expressions = [];
    for(var key in this.node_types) {
        if (this.node_types.hasOwnProperty(key) & this.node_types[key].type == 'distribution') {
            distributions.push(key);
        }
        if (this.node_types.hasOwnProperty(key) & this.node_types[key].type == 'expression') {
            expressions.push(key);
        }
    }
    var nodes = distributions.sort().concat(expressions.sort())
    var sideList = nodes.map((key) => {
						return (

                            <ListItem  key={key} button onClick={() => this.newNode(key)}>
                                  <Avatar>
                                      <DistributionIcon key={key} icon_type = {this.node_types[key].module}/>
          </Avatar>
          <ListItemText primary={key} secondary={this.node_types[key].module} />
                                    </ListItem>
						)

					})

    const fullList = (
      <div className={classes.listFull}>
        <Divider />
      </div>
    );
  const bull = <span className={classes.bullet}>•</span>;

    return (
      <div>
        <Button onClick={this.toggleDrawer('left', true)}>Add Node</Button>
          <Button className={classes.button} onClick={this.props.generate}>Compile</Button>
        <Drawer open={this.state.left} onRequestClose={this.toggleDrawer('left', false)}>
          <div
            tabIndex={0}
            role="button"
            onClick={this.toggleDrawer('left', false)}
            onKeyDown={this.toggleDrawer('left', false)}
          >
              <div>

              </div>
              <Card className={classes.card}>
        <CardContent>
<SwitchListSecondary/>
        </CardContent>
        <CardActions>
          <Button dense>Learn More</Button>
        </CardActions>
      </Card>
              <div style={{maxHeight:'500px',overflow:'scroll'}}>
              <List >
            {sideList}
              </List>
              </div>
          </div>
        </Drawer>
      </div>
    );
  }
}

TemporaryDrawer.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(TemporaryDrawer);

