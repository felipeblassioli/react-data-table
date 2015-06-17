var React = require('react');
var DataTable = require('./components/DataTable.react');
var ReadOnlyTable = require('./components/ReadOnlyTable.react');

var data = [
	{"name": "Felipe", "age": 21},
	{"name": "Mikail", "age": 23}
];

var App = React.createClass({
	render: function(){
		var extras = <button>bla</button>;
		return(
			<div className="container">
				<ReadOnlyTable data={data} />
				<DataTable initialData={data} 
					canEdit={true} 
					canDelete={true}
					canAdd={true} 
					extraRowActions={extras} />
				<DataTable 
					canEdit={true} 
					canDelete={true}
					canAdd={true} 
					extraRowActions={extras} />
			</div>
		);
	}
});

React.render(
	<App />,
	document.getElementById('app')
);

module.exports = DataTable;