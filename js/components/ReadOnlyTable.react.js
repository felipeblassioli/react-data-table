var React = require('react');
var _ = require('underscore');
var $ = require('jquery');

var ReadOnlyTable = React.createClass({
	propTypes: {
		data: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
		columns: React.PropTypes.arrayOf(React.PropTypes.string),
		renderField: React.PropTypes.func,
		renderColumn: React.PropTypes.func,
		onRowClick: React.PropTypes.func
	},
	getDefaultProps: function(){
		return {
			data: [],
			extraFields: [],
			extraColumns: [],
			className: "table table-striped table-condensed table-hover",
			renderField: function(row, column, rowIndex){
				var val = null;
				if(column in row)
					val = row[column];
				return val;
			},
			renderColumn: function(c){ return c }
		};
	},
	getInitialState: function(){
		return {};
	},
	handleRowClick: function(row, rowIndex){
		if(this.props.onRowClick)
			this.props.onRowClick(row, rowIndex);
		this.state.lastSelectedRow = row;
		this.state.lastSelectedRowIndex = rowIndex;
	},
	componentDidMount: function(){
		$( React.findDOMNode(this.refs.tbody) ).on("click", "tr", function(evt){ 
				var i = $( evt.target ).parentsUntil("tbody", "tr").index();
				if(i < this.props.data.length)
					this.handleRowClick( this.props.data[i], i );
			}.bind(this)
		);
	},
	makeDataRows: function(columns){
		var data = this.props.data;
		var renderField = this.props.renderField.bind(this);

		return data.filter(_.isObject).map(function(item, rowIndex){
			return (
				<tr key={rowIndex}>
					{ 
						columns.map(function(c,i){ 
							return <td key={i}>{ renderField(item, c, rowIndex) }</td>
						}) 
					}

					{ this.props.extraFields.map(function(x, i){ return <td key={i+columns.length}>{x}</td> }) }
				</tr>
			)
		}.bind(this)); 
	},
	makeColumns: function(){
		var columns;
		if(this.props.columns){
			columns = this.props.columns;
		}else if(this.props.data.length > 0){
			columns = Object.keys(this.props.data[0]);
		}else{
			columns = [];
		}

		/* Merge extraColumns */
		if(this.props.extraColumns){
			var _columns = _.range(_.keys(this.props.extraColumns).length + columns.length);
			_columns = _.map(_columns, function(index){ return this[index] }.bind(this.props.extraColumns) );

			var index = 0;
			for(var i=0; i < _columns.length; i++)
				_columns[i] = _.isUndefined(_columns[i])? columns[index++] : _columns[i];
			columns = _columns;
		}
		return columns;
	},
	render: function(){
		var columns = this.makeColumns();
		return (
			<table className={this.props.className} ref="table">
				<thead>
					<tr>
						{ 
							columns.map(function(c, i){ 
								return <th key={i}>{ this.props.renderColumn(c) }</th> 
							}.bind(this)) 
						}
					</tr>
				</thead>
				<tbody ref="tbody">
					{ this.makeDataRows(columns) }
				</tbody>
			</table>
		);
	}
});

module.exports = ReadOnlyTable;