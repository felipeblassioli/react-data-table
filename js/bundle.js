(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ReactUI = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var React = require('react');
var DataTable = require('./components/DataTable.react');
var ReadOnlyTable = require('./components/ReadOnlyTable.react');

var data = [
	{"name": "Felipe", "age": 21},
	{"name": "Mikail", "age": 23}
];

var App = React.createClass({displayName: "App",
	render: function(){
		var extras = React.createElement("button", null, "bla");
		return(
			React.createElement("div", {className: "container"}, 
				React.createElement(ReadOnlyTable, {data: data}), 
				React.createElement(DataTable, {initialData: data, 
					canEdit: true, 
					canDelete: true, 
					canAdd: true, 
					extraRowActions: extras}), 
				React.createElement(DataTable, {
					canEdit: true, 
					canDelete: true, 
					canAdd: true, 
					extraRowActions: extras})
			)
		);
	}
});

React.render(
	React.createElement(App, null),
	document.getElementById('app')
);

module.exports = {
	"DataTable": DataTable,
	"ReadOnlyTable": ReadOnlyTable
};
},{"./components/DataTable.react":2,"./components/ReadOnlyTable.react":3,"react":"react"}],2:[function(require,module,exports){
var React = require('react');
var _ = require('underscore');
var $ = require('jquery');

var ReadOnlyTable = require('./ReadOnlyTable.react');


function clone(obj) {
    if(obj === null || typeof(obj) !== 'object' || 'isActiveClone' in obj)
        return obj;

    var temp = obj.constructor(); // changed

    for(var key in obj) {
        if(Object.prototype.hasOwnProperty.call(obj, key)) {
            obj['isActiveClone'] = null;
            temp[key] = clone(obj[key]);
            delete obj['isActiveClone'];
        }
    }    

    return temp;
}

var Checkbox = React.createClass({displayName: "Checkbox",
	getInitialState: function() { 
		return { isChecked: this.props.checked }; 
	},
	onChange: function() { 
		var checked = !this.state.isChecked;
		this.setState({isChecked: checked}); 
		if(this.props.onChange)
			this.props.onChange(checked);
	},
	render: function() {
		//var { checked, ...other } = this.props;
		//var fancyClass = checked ? 'FancyChecked' : 'FancyUnchecked';
		// `other` contains { onClick: console.log } but not the checked property
		/*return (
			<div {...other} className={fancyClass} />
		);*/
		return (
			React.createElement("input", {type: "checkbox", 
					checked: this.state.isChecked, 
					onChange: this.onChange})
		);
	}
});

var EditableField = React.createClass({displayName: "EditableField",
	propTypes: {
		onEdit: React.PropTypes.func,
		onChange: React.PropTypes.func
	},
	getInitialState: function(){
		return {value: this.props.initialValue};
	},
	handleChange: function(evt){
		if(this.props.onChange)
			this.props.onChange(evt.target.value);
		this.setState({value: evt.target.value});
	},
	handleKeyDown: function(evt){
		if(this.props.onEdit && evt.key == "Enter"){
			this.props.onEdit(this.state.value);
		}
	},
	render: function(){
		return (
			React.createElement("input", {type: "text", value: this.state.value, onKeyDown: this.handleKeyDown, onChange: this.handleChange})
		)
	}
});

var ImageButton = React.createClass({displayName: "ImageButton",
	getInitialState: function(){
		return {enabled: true};
	},
	setEnabled: function(b){
		this.setState({enabled: b});
	},
	render: function(){
		var klass = this.props.className;

		var style = this.state.enabled? {} : { pointerEvents: "none" };				
		return (
			React.createElement("a", {href: "javascript: void(0)", style: style, onClick: this.props.onClick}, React.createElement("span", {className: klass, ref: "placeholder", disabled: this.state.enabled}))
		);
	}
});


var DataTable = React.createClass({displayName: "DataTable",
	propTypes: {
		initialData: React.PropTypes.array,
		onRowDelete: React.PropTypes.func,
		onRowEdit: React.PropTypes.func,
		onRowAdd: React.PropTypes.func,
		canAdd: React.PropTypes.bool,
		canEdit: React.PropTypes.bool,
		canDelete: React.PropTypes.bool
	},
	getDefaultProps: function(){
		return {
			initialData: [],
			canAdd: false,
			canEdit: false,
			canDelete: false
		}
	},
	getInitialState: function(){
		return { 
			data: this.props.initialData, 
			editableRowIndexes: [], 
			selectedRowIndexes: [], 
			dummyRowIndex: -1
		}
	},
	toggleSelectAll: function(checked){
		var len = this.props.canAdd? this.state.data.length - 1 : this.state.data.length;
		var indexes = checked? _.range(len) : [];
		this.state.selectedRowIndexes = indexes;
		this.forceUpdate()
	},
	selectedRows: function(){
		console.log(this.state.selectedRowIndexes)
		return _.map(this.state.selectedRowIndexes, function(i){ var r = clone(this[i]); r.index = i; return r; }.bind(this.state.data))
	},
	handleRowClick: function(row, rowIndex){
		if(this.props.onRowClick){
			if(rowIndex != this.state.dummyRowIndex)
				this.props.onRowClick(row, rowIndex);
		}
		this.state.lastSelectedRow = row;
		this.state.lastSelectedRowIndex = rowIndex;
	},
	handleAddButtonClick: function(row, rowIndex){
		this.state.data[this.state.data.length-1] = this.state.rowAddBuffer;
		this.addDummyItemIfNeeded();

		if(this.props.onRowAdd)
			this.props.onRowAdd(row,rowIndex);
	},
	handleEditButtonClick: function(){
		var rowIndex = this.refs.dataTable.state.lastSelectedRowIndex;
		var i = this.state.editableRowIndexes.indexOf(rowIndex);
		if( i > -1 )
			this.state.editableRowIndexes.splice(i,1);
		else
			this.state.editableRowIndexes.push(rowIndex);
		this.forceUpdate();
	},
	handleDeleteButtonClick: function(){
		var index = this.refs.dataTable.state.lastSelectedRowIndex;
		if(confirm('Are you sure you want to delete this record?') ){
			this.deleteRow(index);
			this.forceUpdate();
		}
	},
	deleteRow: function(index){
		this.state.selectedRowIndexes = _.map(this.state.selectedRowIndexes, function(i){ return i > index? i - 1 : i});
		var i = _.indexOf(this.state.selectedRowIndexes, index);
		if(i != -1)
			this.state.selectedRowIndexes.splice(i, 1);

		var deletedItems = this.state.data.splice(index, 1);
		if(this.props.canAdd)
			this.state.dummyRowIndex = this.state.dummyRowIndex - 1;
		if(this.props.onRowDelete)
			this.props.onRowDelete.apply(null, deletedItems);
	},
	addDummyItemIfNeeded: function(){
		if(this.refs.dataTable){
			var columns = this.refs.dataTable.makeColumns();
			var index = columns.indexOf("actions");

			if(index != -1)
				columns.splice(index, 1);

			var dummy = {};
			for(var i=0; i<columns.length; i++)
				dummy[columns[i]] = "";
			
			this.state.rowAddBuffer = {};
			for(var i=0; i<columns.length; i++)
				this.state.rowAddBuffer[columns[i]] = "";

			this.state.data.push(dummy);
			this.state.dummyRowIndex = this.state.data.length-1;

			this.forceUpdate();
		}
	},
	componentDidMount: function(){
		if(this.props.canAdd){
			this.addDummyItemIfNeeded();
		}
	},
	render: function(){
		//TODO: props handling need some love
		var $__0=        this.props,columns=$__0.columns,extraColumns=$__0.extraColumns,renderColumn=$__0.renderColumn,renderField=$__0.renderField,other=(function(source, exclusion) {var rest = {};var hasOwn = Object.prototype.hasOwnProperty;if (source == null) {throw new TypeError();}for (var key in source) {if (hasOwn.call(source, key) && !hasOwn.call(exclusion, key)) {rest[key] = source[key];}}return rest;})($__0,{columns:1,extraColumns:1,renderColumn:1,renderField:1});
		var extraColumns = {};
		if(this.props.canEdit || this.props.canDelete)
			extraColumns[0] = "actions";

		var batchActions = [];
		if(this.props.canDelete){
			var batchDelete = function(rows){
				var count = 0;
				_.each(rows, function(r){
					var index = r.index - count;
					this.deleteRow(index);
					count = count + 1;
				}.bind(this));

				this.forceUpdate();
			}.bind(this);
			batchActions.push(React.createElement("button", {onClick: batchDelete}, "delete selected"));
		}

		var renderColumn = function(columnName){
			if(columnName === "actions"){
				if(batchActions.length > 0 )
					return  (
						React.createElement("div", null, 
							React.createElement(Checkbox, {checked: this.state.selectAllChecked, onChange: this.toggleSelectAll, ref: "selectAll"}), 
							 
								batchActions.map(function(element){ 
									if(element.props.onClick){
										var _onClick = function(){
											return element.props.onClick(this.selectedRows());
										}.bind(this);
										return React.cloneElement(element, {onClick: _onClick});
									}
									return element;
								}.bind(this)) 
							
						)
					);
				else
					return "";
			}else if(this.props.renderColumn){
				return this.props.renderColumn.apply(null, arguments);
			}else{
				return columnName;
			}
		}.bind(this);

		var makeRowActions = function(){
			var buttons = [];
			if(this.props.canEdit)
				buttons.push(React.createElement(ImageButton, {className: "glyphicon glyphicon-pencil", onClick: this.handleEditButtonClick}));
			if(this.props.canDelete)
				buttons.push(React.createElement(ImageButton, {className: "glyphicon glyphicon-trash", onClick: this.handleDeleteButtonClick}));
			return (
				React.createElement("div", null, 
					buttons, 
					 this.props.extraRowActions
				)
			);
		}.bind(this);

		var renderField = function(row, columnName, rowIndex){
			var callHandleFieldEdit = function(row, rowIndex, newValue){
				var oldRow = clone(row);
				row[columnName] = newValue;

				var newRow = row;
				var i = this.state.editableRowIndexes.indexOf(rowIndex);
				this.state.editableRowIndexes.splice(i,1);

				if(this.props.onRowEdit)
					this.props.onRowEdit(oldRow, newRow, rowIndex);

				this.forceUpdate();
			};

			if(columnName === "actions"){
				return makeRowActions();
			}else if(this.state.editableRowIndexes.indexOf(rowIndex) > -1){
				return React.createElement(EditableField, {initialValue: row[columnName], onEdit: callHandleFieldEdit.bind(this,row,rowIndex)})
			}else if(this.props.renderField){
				return this.props.renderField.apply(null, arguments);
			} else{
				return row[columnName];
			}
		}.bind(this);

		if(this.props.canAdd){
			var _renderField = renderField;
			renderField = function(row, columnName, rowIndex){
				if(this.state.dummyRowIndex === rowIndex){
					if(columnName === "actions"){
						return React.createElement(ImageButton, {className: "glyphicon glyphicon-plus", onClick: this.handleAddButtonClick.bind(this, row, rowIndex)})
					}else{
						var updateValue = function(columnName, val){
							this.state.rowAddBuffer[columnName] = val;
						}.bind(this, columnName);
						return React.createElement(EditableField, {initialValue: "", onChange: updateValue, onEdit: this.handleAddButtonClick.bind(this, row, rowIndex)});
					}
				}else{
					return _renderField(row, columnName, rowIndex);
				}
			}.bind(this);
		}

		this.state.addRowRefs = {};
		return (
			React.createElement(ReadOnlyTable, React.__spread({},  other, 
				{data: this.state.data, 
				columns: columns, 
				extraColumns: extraColumns, 
				renderColumn: renderColumn, 
				renderField: renderField, 

				onRowClick: this.handleRowClick, 
				ref: "dataTable"}), 

				 this.props.children
			)	
		);
	}
});

module.exports = DataTable;
},{"./ReadOnlyTable.react":3,"jquery":"jquery","react":"react","underscore":"underscore"}],3:[function(require,module,exports){
var React = require('react');
var _ = require('underscore');
var $ = require('jquery');

var ReadOnlyTable = React.createClass({displayName: "ReadOnlyTable",
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
				React.createElement("tr", {key: rowIndex}, 
					 
						columns.map(function(c,i){ 
							return React.createElement("td", {key: i},  renderField(item, c, rowIndex) )
						}), 
					

					 this.props.extraFields.map(function(x, i){ return React.createElement("td", {key: i+columns.length}, x) }) 
				)
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
			React.createElement("table", {className: this.props.className, ref: "table"}, 
				React.createElement("thead", null, 
					React.createElement("tr", null, 
						 
							columns.map(function(c, i){ 
								return React.createElement("th", {key: i},  this.props.renderColumn(c) ) 
							}.bind(this)) 
						
					)
				), 
				React.createElement("tbody", {ref: "tbody"}, 
					 this.makeDataRows(columns) 
				)
			)
		);
	}
});

module.exports = ReadOnlyTable;
},{"jquery":"jquery","react":"react","underscore":"underscore"}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwianMvYXBwLmpzIiwianMvY29tcG9uZW50cy9EYXRhVGFibGUucmVhY3QuanMiLCJqcy9jb21wb25lbnRzL1JlYWRPbmx5VGFibGUucmVhY3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xudmFyIERhdGFUYWJsZSA9IHJlcXVpcmUoJy4vY29tcG9uZW50cy9EYXRhVGFibGUucmVhY3QnKTtcbnZhciBSZWFkT25seVRhYmxlID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL1JlYWRPbmx5VGFibGUucmVhY3QnKTtcblxudmFyIGRhdGEgPSBbXG5cdHtcIm5hbWVcIjogXCJGZWxpcGVcIiwgXCJhZ2VcIjogMjF9LFxuXHR7XCJuYW1lXCI6IFwiTWlrYWlsXCIsIFwiYWdlXCI6IDIzfVxuXTtcblxudmFyIEFwcCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogXCJBcHBcIixcblx0cmVuZGVyOiBmdW5jdGlvbigpe1xuXHRcdHZhciBleHRyYXMgPSBSZWFjdC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIsIG51bGwsIFwiYmxhXCIpO1xuXHRcdHJldHVybihcblx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJjb250YWluZXJcIn0sIFxuXHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFJlYWRPbmx5VGFibGUsIHtkYXRhOiBkYXRhfSksIFxuXHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KERhdGFUYWJsZSwge2luaXRpYWxEYXRhOiBkYXRhLCBcblx0XHRcdFx0XHRjYW5FZGl0OiB0cnVlLCBcblx0XHRcdFx0XHRjYW5EZWxldGU6IHRydWUsIFxuXHRcdFx0XHRcdGNhbkFkZDogdHJ1ZSwgXG5cdFx0XHRcdFx0ZXh0cmFSb3dBY3Rpb25zOiBleHRyYXN9KSwgXG5cdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoRGF0YVRhYmxlLCB7XG5cdFx0XHRcdFx0Y2FuRWRpdDogdHJ1ZSwgXG5cdFx0XHRcdFx0Y2FuRGVsZXRlOiB0cnVlLCBcblx0XHRcdFx0XHRjYW5BZGQ6IHRydWUsIFxuXHRcdFx0XHRcdGV4dHJhUm93QWN0aW9uczogZXh0cmFzfSlcblx0XHRcdClcblx0XHQpO1xuXHR9XG59KTtcblxuUmVhY3QucmVuZGVyKFxuXHRSZWFjdC5jcmVhdGVFbGVtZW50KEFwcCwgbnVsbCksXG5cdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcHAnKVxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdFwiRGF0YVRhYmxlXCI6IERhdGFUYWJsZSxcblx0XCJSZWFkT25seVRhYmxlXCI6IFJlYWRPbmx5VGFibGVcbn07IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcblxudmFyIFJlYWRPbmx5VGFibGUgPSByZXF1aXJlKCcuL1JlYWRPbmx5VGFibGUucmVhY3QnKTtcblxuXG5mdW5jdGlvbiBjbG9uZShvYmopIHtcbiAgICBpZihvYmogPT09IG51bGwgfHwgdHlwZW9mKG9iaikgIT09ICdvYmplY3QnIHx8ICdpc0FjdGl2ZUNsb25lJyBpbiBvYmopXG4gICAgICAgIHJldHVybiBvYmo7XG5cbiAgICB2YXIgdGVtcCA9IG9iai5jb25zdHJ1Y3RvcigpOyAvLyBjaGFuZ2VkXG5cbiAgICBmb3IodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgaWYoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkge1xuICAgICAgICAgICAgb2JqWydpc0FjdGl2ZUNsb25lJ10gPSBudWxsO1xuICAgICAgICAgICAgdGVtcFtrZXldID0gY2xvbmUob2JqW2tleV0pO1xuICAgICAgICAgICAgZGVsZXRlIG9ialsnaXNBY3RpdmVDbG9uZSddO1xuICAgICAgICB9XG4gICAgfSAgICBcblxuICAgIHJldHVybiB0ZW1wO1xufVxuXG52YXIgQ2hlY2tib3ggPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6IFwiQ2hlY2tib3hcIixcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHsgXG5cdFx0cmV0dXJuIHsgaXNDaGVja2VkOiB0aGlzLnByb3BzLmNoZWNrZWQgfTsgXG5cdH0sXG5cdG9uQ2hhbmdlOiBmdW5jdGlvbigpIHsgXG5cdFx0dmFyIGNoZWNrZWQgPSAhdGhpcy5zdGF0ZS5pc0NoZWNrZWQ7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7aXNDaGVja2VkOiBjaGVja2VkfSk7IFxuXHRcdGlmKHRoaXMucHJvcHMub25DaGFuZ2UpXG5cdFx0XHR0aGlzLnByb3BzLm9uQ2hhbmdlKGNoZWNrZWQpO1xuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdC8vdmFyIHsgY2hlY2tlZCwgLi4ub3RoZXIgfSA9IHRoaXMucHJvcHM7XG5cdFx0Ly92YXIgZmFuY3lDbGFzcyA9IGNoZWNrZWQgPyAnRmFuY3lDaGVja2VkJyA6ICdGYW5jeVVuY2hlY2tlZCc7XG5cdFx0Ly8gYG90aGVyYCBjb250YWlucyB7IG9uQ2xpY2s6IGNvbnNvbGUubG9nIH0gYnV0IG5vdCB0aGUgY2hlY2tlZCBwcm9wZXJ0eVxuXHRcdC8qcmV0dXJuIChcblx0XHRcdDxkaXYgey4uLm90aGVyfSBjbGFzc05hbWU9e2ZhbmN5Q2xhc3N9IC8+XG5cdFx0KTsqL1xuXHRcdHJldHVybiAoXG5cdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIiwge3R5cGU6IFwiY2hlY2tib3hcIiwgXG5cdFx0XHRcdFx0Y2hlY2tlZDogdGhpcy5zdGF0ZS5pc0NoZWNrZWQsIFxuXHRcdFx0XHRcdG9uQ2hhbmdlOiB0aGlzLm9uQ2hhbmdlfSlcblx0XHQpO1xuXHR9XG59KTtcblxudmFyIEVkaXRhYmxlRmllbGQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6IFwiRWRpdGFibGVGaWVsZFwiLFxuXHRwcm9wVHlwZXM6IHtcblx0XHRvbkVkaXQ6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuXHRcdG9uQ2hhbmdlOiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuXHR9LFxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHt2YWx1ZTogdGhpcy5wcm9wcy5pbml0aWFsVmFsdWV9O1xuXHR9LFxuXHRoYW5kbGVDaGFuZ2U6IGZ1bmN0aW9uKGV2dCl7XG5cdFx0aWYodGhpcy5wcm9wcy5vbkNoYW5nZSlcblx0XHRcdHRoaXMucHJvcHMub25DaGFuZ2UoZXZ0LnRhcmdldC52YWx1ZSk7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7dmFsdWU6IGV2dC50YXJnZXQudmFsdWV9KTtcblx0fSxcblx0aGFuZGxlS2V5RG93bjogZnVuY3Rpb24oZXZ0KXtcblx0XHRpZih0aGlzLnByb3BzLm9uRWRpdCAmJiBldnQua2V5ID09IFwiRW50ZXJcIil7XG5cdFx0XHR0aGlzLnByb3BzLm9uRWRpdCh0aGlzLnN0YXRlLnZhbHVlKTtcblx0XHR9XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gKFxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcImlucHV0XCIsIHt0eXBlOiBcInRleHRcIiwgdmFsdWU6IHRoaXMuc3RhdGUudmFsdWUsIG9uS2V5RG93bjogdGhpcy5oYW5kbGVLZXlEb3duLCBvbkNoYW5nZTogdGhpcy5oYW5kbGVDaGFuZ2V9KVxuXHRcdClcblx0fVxufSk7XG5cbnZhciBJbWFnZUJ1dHRvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogXCJJbWFnZUJ1dHRvblwiLFxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHtlbmFibGVkOiB0cnVlfTtcblx0fSxcblx0c2V0RW5hYmxlZDogZnVuY3Rpb24oYil7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7ZW5hYmxlZDogYn0pO1xuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIGtsYXNzID0gdGhpcy5wcm9wcy5jbGFzc05hbWU7XG5cblx0XHR2YXIgc3R5bGUgPSB0aGlzLnN0YXRlLmVuYWJsZWQ/IHt9IDogeyBwb2ludGVyRXZlbnRzOiBcIm5vbmVcIiB9O1x0XHRcdFx0XG5cdFx0cmV0dXJuIChcblx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJhXCIsIHtocmVmOiBcImphdmFzY3JpcHQ6IHZvaWQoMClcIiwgc3R5bGU6IHN0eWxlLCBvbkNsaWNrOiB0aGlzLnByb3BzLm9uQ2xpY2t9LCBSZWFjdC5jcmVhdGVFbGVtZW50KFwic3BhblwiLCB7Y2xhc3NOYW1lOiBrbGFzcywgcmVmOiBcInBsYWNlaG9sZGVyXCIsIGRpc2FibGVkOiB0aGlzLnN0YXRlLmVuYWJsZWR9KSlcblx0XHQpO1xuXHR9XG59KTtcblxuXG52YXIgRGF0YVRhYmxlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiBcIkRhdGFUYWJsZVwiLFxuXHRwcm9wVHlwZXM6IHtcblx0XHRpbml0aWFsRGF0YTogUmVhY3QuUHJvcFR5cGVzLmFycmF5LFxuXHRcdG9uUm93RGVsZXRlOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcblx0XHRvblJvd0VkaXQ6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuXHRcdG9uUm93QWRkOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcblx0XHRjYW5BZGQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuXHRcdGNhbkVkaXQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuXHRcdGNhbkRlbGV0ZTogUmVhY3QuUHJvcFR5cGVzLmJvb2xcblx0fSxcblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB7XG5cdFx0XHRpbml0aWFsRGF0YTogW10sXG5cdFx0XHRjYW5BZGQ6IGZhbHNlLFxuXHRcdFx0Y2FuRWRpdDogZmFsc2UsXG5cdFx0XHRjYW5EZWxldGU6IGZhbHNlXG5cdFx0fVxuXHR9LFxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHsgXG5cdFx0XHRkYXRhOiB0aGlzLnByb3BzLmluaXRpYWxEYXRhLCBcblx0XHRcdGVkaXRhYmxlUm93SW5kZXhlczogW10sIFxuXHRcdFx0c2VsZWN0ZWRSb3dJbmRleGVzOiBbXSwgXG5cdFx0XHRkdW1teVJvd0luZGV4OiAtMVxuXHRcdH1cblx0fSxcblx0dG9nZ2xlU2VsZWN0QWxsOiBmdW5jdGlvbihjaGVja2VkKXtcblx0XHR2YXIgbGVuID0gdGhpcy5wcm9wcy5jYW5BZGQ/IHRoaXMuc3RhdGUuZGF0YS5sZW5ndGggLSAxIDogdGhpcy5zdGF0ZS5kYXRhLmxlbmd0aDtcblx0XHR2YXIgaW5kZXhlcyA9IGNoZWNrZWQ/IF8ucmFuZ2UobGVuKSA6IFtdO1xuXHRcdHRoaXMuc3RhdGUuc2VsZWN0ZWRSb3dJbmRleGVzID0gaW5kZXhlcztcblx0XHR0aGlzLmZvcmNlVXBkYXRlKClcblx0fSxcblx0c2VsZWN0ZWRSb3dzOiBmdW5jdGlvbigpe1xuXHRcdGNvbnNvbGUubG9nKHRoaXMuc3RhdGUuc2VsZWN0ZWRSb3dJbmRleGVzKVxuXHRcdHJldHVybiBfLm1hcCh0aGlzLnN0YXRlLnNlbGVjdGVkUm93SW5kZXhlcywgZnVuY3Rpb24oaSl7IHZhciByID0gY2xvbmUodGhpc1tpXSk7IHIuaW5kZXggPSBpOyByZXR1cm4gcjsgfS5iaW5kKHRoaXMuc3RhdGUuZGF0YSkpXG5cdH0sXG5cdGhhbmRsZVJvd0NsaWNrOiBmdW5jdGlvbihyb3csIHJvd0luZGV4KXtcblx0XHRpZih0aGlzLnByb3BzLm9uUm93Q2xpY2spe1xuXHRcdFx0aWYocm93SW5kZXggIT0gdGhpcy5zdGF0ZS5kdW1teVJvd0luZGV4KVxuXHRcdFx0XHR0aGlzLnByb3BzLm9uUm93Q2xpY2socm93LCByb3dJbmRleCk7XG5cdFx0fVxuXHRcdHRoaXMuc3RhdGUubGFzdFNlbGVjdGVkUm93ID0gcm93O1xuXHRcdHRoaXMuc3RhdGUubGFzdFNlbGVjdGVkUm93SW5kZXggPSByb3dJbmRleDtcblx0fSxcblx0aGFuZGxlQWRkQnV0dG9uQ2xpY2s6IGZ1bmN0aW9uKHJvdywgcm93SW5kZXgpe1xuXHRcdHRoaXMuc3RhdGUuZGF0YVt0aGlzLnN0YXRlLmRhdGEubGVuZ3RoLTFdID0gdGhpcy5zdGF0ZS5yb3dBZGRCdWZmZXI7XG5cdFx0dGhpcy5hZGREdW1teUl0ZW1JZk5lZWRlZCgpO1xuXG5cdFx0aWYodGhpcy5wcm9wcy5vblJvd0FkZClcblx0XHRcdHRoaXMucHJvcHMub25Sb3dBZGQocm93LHJvd0luZGV4KTtcblx0fSxcblx0aGFuZGxlRWRpdEJ1dHRvbkNsaWNrOiBmdW5jdGlvbigpe1xuXHRcdHZhciByb3dJbmRleCA9IHRoaXMucmVmcy5kYXRhVGFibGUuc3RhdGUubGFzdFNlbGVjdGVkUm93SW5kZXg7XG5cdFx0dmFyIGkgPSB0aGlzLnN0YXRlLmVkaXRhYmxlUm93SW5kZXhlcy5pbmRleE9mKHJvd0luZGV4KTtcblx0XHRpZiggaSA+IC0xIClcblx0XHRcdHRoaXMuc3RhdGUuZWRpdGFibGVSb3dJbmRleGVzLnNwbGljZShpLDEpO1xuXHRcdGVsc2Vcblx0XHRcdHRoaXMuc3RhdGUuZWRpdGFibGVSb3dJbmRleGVzLnB1c2gocm93SW5kZXgpO1xuXHRcdHRoaXMuZm9yY2VVcGRhdGUoKTtcblx0fSxcblx0aGFuZGxlRGVsZXRlQnV0dG9uQ2xpY2s6IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIGluZGV4ID0gdGhpcy5yZWZzLmRhdGFUYWJsZS5zdGF0ZS5sYXN0U2VsZWN0ZWRSb3dJbmRleDtcblx0XHRpZihjb25maXJtKCdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHRoaXMgcmVjb3JkPycpICl7XG5cdFx0XHR0aGlzLmRlbGV0ZVJvdyhpbmRleCk7XG5cdFx0XHR0aGlzLmZvcmNlVXBkYXRlKCk7XG5cdFx0fVxuXHR9LFxuXHRkZWxldGVSb3c6IGZ1bmN0aW9uKGluZGV4KXtcblx0XHR0aGlzLnN0YXRlLnNlbGVjdGVkUm93SW5kZXhlcyA9IF8ubWFwKHRoaXMuc3RhdGUuc2VsZWN0ZWRSb3dJbmRleGVzLCBmdW5jdGlvbihpKXsgcmV0dXJuIGkgPiBpbmRleD8gaSAtIDEgOiBpfSk7XG5cdFx0dmFyIGkgPSBfLmluZGV4T2YodGhpcy5zdGF0ZS5zZWxlY3RlZFJvd0luZGV4ZXMsIGluZGV4KTtcblx0XHRpZihpICE9IC0xKVxuXHRcdFx0dGhpcy5zdGF0ZS5zZWxlY3RlZFJvd0luZGV4ZXMuc3BsaWNlKGksIDEpO1xuXG5cdFx0dmFyIGRlbGV0ZWRJdGVtcyA9IHRoaXMuc3RhdGUuZGF0YS5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdGlmKHRoaXMucHJvcHMuY2FuQWRkKVxuXHRcdFx0dGhpcy5zdGF0ZS5kdW1teVJvd0luZGV4ID0gdGhpcy5zdGF0ZS5kdW1teVJvd0luZGV4IC0gMTtcblx0XHRpZih0aGlzLnByb3BzLm9uUm93RGVsZXRlKVxuXHRcdFx0dGhpcy5wcm9wcy5vblJvd0RlbGV0ZS5hcHBseShudWxsLCBkZWxldGVkSXRlbXMpO1xuXHR9LFxuXHRhZGREdW1teUl0ZW1JZk5lZWRlZDogZnVuY3Rpb24oKXtcblx0XHRpZih0aGlzLnJlZnMuZGF0YVRhYmxlKXtcblx0XHRcdHZhciBjb2x1bW5zID0gdGhpcy5yZWZzLmRhdGFUYWJsZS5tYWtlQ29sdW1ucygpO1xuXHRcdFx0dmFyIGluZGV4ID0gY29sdW1ucy5pbmRleE9mKFwiYWN0aW9uc1wiKTtcblxuXHRcdFx0aWYoaW5kZXggIT0gLTEpXG5cdFx0XHRcdGNvbHVtbnMuc3BsaWNlKGluZGV4LCAxKTtcblxuXHRcdFx0dmFyIGR1bW15ID0ge307XG5cdFx0XHRmb3IodmFyIGk9MDsgaTxjb2x1bW5zLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHRkdW1teVtjb2x1bW5zW2ldXSA9IFwiXCI7XG5cdFx0XHRcblx0XHRcdHRoaXMuc3RhdGUucm93QWRkQnVmZmVyID0ge307XG5cdFx0XHRmb3IodmFyIGk9MDsgaTxjb2x1bW5zLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHR0aGlzLnN0YXRlLnJvd0FkZEJ1ZmZlcltjb2x1bW5zW2ldXSA9IFwiXCI7XG5cblx0XHRcdHRoaXMuc3RhdGUuZGF0YS5wdXNoKGR1bW15KTtcblx0XHRcdHRoaXMuc3RhdGUuZHVtbXlSb3dJbmRleCA9IHRoaXMuc3RhdGUuZGF0YS5sZW5ndGgtMTtcblxuXHRcdFx0dGhpcy5mb3JjZVVwZGF0ZSgpO1xuXHRcdH1cblx0fSxcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCl7XG5cdFx0aWYodGhpcy5wcm9wcy5jYW5BZGQpe1xuXHRcdFx0dGhpcy5hZGREdW1teUl0ZW1JZk5lZWRlZCgpO1xuXHRcdH1cblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbigpe1xuXHRcdC8vVE9ETzogcHJvcHMgaGFuZGxpbmcgbmVlZCBzb21lIGxvdmVcblx0XHR2YXIgJF9fMD0gICAgICAgIHRoaXMucHJvcHMsY29sdW1ucz0kX18wLmNvbHVtbnMsZXh0cmFDb2x1bW5zPSRfXzAuZXh0cmFDb2x1bW5zLHJlbmRlckNvbHVtbj0kX18wLnJlbmRlckNvbHVtbixyZW5kZXJGaWVsZD0kX18wLnJlbmRlckZpZWxkLG90aGVyPShmdW5jdGlvbihzb3VyY2UsIGV4Y2x1c2lvbikge3ZhciByZXN0ID0ge307dmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7aWYgKHNvdXJjZSA9PSBudWxsKSB7dGhyb3cgbmV3IFR5cGVFcnJvcigpO31mb3IgKHZhciBrZXkgaW4gc291cmNlKSB7aWYgKGhhc093bi5jYWxsKHNvdXJjZSwga2V5KSAmJiAhaGFzT3duLmNhbGwoZXhjbHVzaW9uLCBrZXkpKSB7cmVzdFtrZXldID0gc291cmNlW2tleV07fX1yZXR1cm4gcmVzdDt9KSgkX18wLHtjb2x1bW5zOjEsZXh0cmFDb2x1bW5zOjEscmVuZGVyQ29sdW1uOjEscmVuZGVyRmllbGQ6MX0pO1xuXHRcdHZhciBleHRyYUNvbHVtbnMgPSB7fTtcblx0XHRpZih0aGlzLnByb3BzLmNhbkVkaXQgfHwgdGhpcy5wcm9wcy5jYW5EZWxldGUpXG5cdFx0XHRleHRyYUNvbHVtbnNbMF0gPSBcImFjdGlvbnNcIjtcblxuXHRcdHZhciBiYXRjaEFjdGlvbnMgPSBbXTtcblx0XHRpZih0aGlzLnByb3BzLmNhbkRlbGV0ZSl7XG5cdFx0XHR2YXIgYmF0Y2hEZWxldGUgPSBmdW5jdGlvbihyb3dzKXtcblx0XHRcdFx0dmFyIGNvdW50ID0gMDtcblx0XHRcdFx0Xy5lYWNoKHJvd3MsIGZ1bmN0aW9uKHIpe1xuXHRcdFx0XHRcdHZhciBpbmRleCA9IHIuaW5kZXggLSBjb3VudDtcblx0XHRcdFx0XHR0aGlzLmRlbGV0ZVJvdyhpbmRleCk7XG5cdFx0XHRcdFx0Y291bnQgPSBjb3VudCArIDE7XG5cdFx0XHRcdH0uYmluZCh0aGlzKSk7XG5cblx0XHRcdFx0dGhpcy5mb3JjZVVwZGF0ZSgpO1xuXHRcdFx0fS5iaW5kKHRoaXMpO1xuXHRcdFx0YmF0Y2hBY3Rpb25zLnB1c2goUmVhY3QuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiLCB7b25DbGljazogYmF0Y2hEZWxldGV9LCBcImRlbGV0ZSBzZWxlY3RlZFwiKSk7XG5cdFx0fVxuXG5cdFx0dmFyIHJlbmRlckNvbHVtbiA9IGZ1bmN0aW9uKGNvbHVtbk5hbWUpe1xuXHRcdFx0aWYoY29sdW1uTmFtZSA9PT0gXCJhY3Rpb25zXCIpe1xuXHRcdFx0XHRpZihiYXRjaEFjdGlvbnMubGVuZ3RoID4gMCApXG5cdFx0XHRcdFx0cmV0dXJuICAoXG5cdFx0XHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIG51bGwsIFxuXHRcdFx0XHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KENoZWNrYm94LCB7Y2hlY2tlZDogdGhpcy5zdGF0ZS5zZWxlY3RBbGxDaGVja2VkLCBvbkNoYW5nZTogdGhpcy50b2dnbGVTZWxlY3RBbGwsIHJlZjogXCJzZWxlY3RBbGxcIn0pLCBcblx0XHRcdFx0XHRcdFx0IFxuXHRcdFx0XHRcdFx0XHRcdGJhdGNoQWN0aW9ucy5tYXAoZnVuY3Rpb24oZWxlbWVudCl7IFxuXHRcdFx0XHRcdFx0XHRcdFx0aWYoZWxlbWVudC5wcm9wcy5vbkNsaWNrKXtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dmFyIF9vbkNsaWNrID0gZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZWxlbWVudC5wcm9wcy5vbkNsaWNrKHRoaXMuc2VsZWN0ZWRSb3dzKCkpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9LmJpbmQodGhpcyk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBSZWFjdC5jbG9uZUVsZW1lbnQoZWxlbWVudCwge29uQ2xpY2s6IF9vbkNsaWNrfSk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZWxlbWVudDtcblx0XHRcdFx0XHRcdFx0XHR9LmJpbmQodGhpcykpIFxuXHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0cmV0dXJuIFwiXCI7XG5cdFx0XHR9ZWxzZSBpZih0aGlzLnByb3BzLnJlbmRlckNvbHVtbil7XG5cdFx0XHRcdHJldHVybiB0aGlzLnByb3BzLnJlbmRlckNvbHVtbi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdHJldHVybiBjb2x1bW5OYW1lO1xuXHRcdFx0fVxuXHRcdH0uYmluZCh0aGlzKTtcblxuXHRcdHZhciBtYWtlUm93QWN0aW9ucyA9IGZ1bmN0aW9uKCl7XG5cdFx0XHR2YXIgYnV0dG9ucyA9IFtdO1xuXHRcdFx0aWYodGhpcy5wcm9wcy5jYW5FZGl0KVxuXHRcdFx0XHRidXR0b25zLnB1c2goUmVhY3QuY3JlYXRlRWxlbWVudChJbWFnZUJ1dHRvbiwge2NsYXNzTmFtZTogXCJnbHlwaGljb24gZ2x5cGhpY29uLXBlbmNpbFwiLCBvbkNsaWNrOiB0aGlzLmhhbmRsZUVkaXRCdXR0b25DbGlja30pKTtcblx0XHRcdGlmKHRoaXMucHJvcHMuY2FuRGVsZXRlKVxuXHRcdFx0XHRidXR0b25zLnB1c2goUmVhY3QuY3JlYXRlRWxlbWVudChJbWFnZUJ1dHRvbiwge2NsYXNzTmFtZTogXCJnbHlwaGljb24gZ2x5cGhpY29uLXRyYXNoXCIsIG9uQ2xpY2s6IHRoaXMuaGFuZGxlRGVsZXRlQnV0dG9uQ2xpY2t9KSk7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIG51bGwsIFxuXHRcdFx0XHRcdGJ1dHRvbnMsIFxuXHRcdFx0XHRcdCB0aGlzLnByb3BzLmV4dHJhUm93QWN0aW9uc1xuXHRcdFx0XHQpXG5cdFx0XHQpO1xuXHRcdH0uYmluZCh0aGlzKTtcblxuXHRcdHZhciByZW5kZXJGaWVsZCA9IGZ1bmN0aW9uKHJvdywgY29sdW1uTmFtZSwgcm93SW5kZXgpe1xuXHRcdFx0dmFyIGNhbGxIYW5kbGVGaWVsZEVkaXQgPSBmdW5jdGlvbihyb3csIHJvd0luZGV4LCBuZXdWYWx1ZSl7XG5cdFx0XHRcdHZhciBvbGRSb3cgPSBjbG9uZShyb3cpO1xuXHRcdFx0XHRyb3dbY29sdW1uTmFtZV0gPSBuZXdWYWx1ZTtcblxuXHRcdFx0XHR2YXIgbmV3Um93ID0gcm93O1xuXHRcdFx0XHR2YXIgaSA9IHRoaXMuc3RhdGUuZWRpdGFibGVSb3dJbmRleGVzLmluZGV4T2Yocm93SW5kZXgpO1xuXHRcdFx0XHR0aGlzLnN0YXRlLmVkaXRhYmxlUm93SW5kZXhlcy5zcGxpY2UoaSwxKTtcblxuXHRcdFx0XHRpZih0aGlzLnByb3BzLm9uUm93RWRpdClcblx0XHRcdFx0XHR0aGlzLnByb3BzLm9uUm93RWRpdChvbGRSb3csIG5ld1Jvdywgcm93SW5kZXgpO1xuXG5cdFx0XHRcdHRoaXMuZm9yY2VVcGRhdGUoKTtcblx0XHRcdH07XG5cblx0XHRcdGlmKGNvbHVtbk5hbWUgPT09IFwiYWN0aW9uc1wiKXtcblx0XHRcdFx0cmV0dXJuIG1ha2VSb3dBY3Rpb25zKCk7XG5cdFx0XHR9ZWxzZSBpZih0aGlzLnN0YXRlLmVkaXRhYmxlUm93SW5kZXhlcy5pbmRleE9mKHJvd0luZGV4KSA+IC0xKXtcblx0XHRcdFx0cmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRWRpdGFibGVGaWVsZCwge2luaXRpYWxWYWx1ZTogcm93W2NvbHVtbk5hbWVdLCBvbkVkaXQ6IGNhbGxIYW5kbGVGaWVsZEVkaXQuYmluZCh0aGlzLHJvdyxyb3dJbmRleCl9KVxuXHRcdFx0fWVsc2UgaWYodGhpcy5wcm9wcy5yZW5kZXJGaWVsZCl7XG5cdFx0XHRcdHJldHVybiB0aGlzLnByb3BzLnJlbmRlckZpZWxkLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG5cdFx0XHR9IGVsc2V7XG5cdFx0XHRcdHJldHVybiByb3dbY29sdW1uTmFtZV07XG5cdFx0XHR9XG5cdFx0fS5iaW5kKHRoaXMpO1xuXG5cdFx0aWYodGhpcy5wcm9wcy5jYW5BZGQpe1xuXHRcdFx0dmFyIF9yZW5kZXJGaWVsZCA9IHJlbmRlckZpZWxkO1xuXHRcdFx0cmVuZGVyRmllbGQgPSBmdW5jdGlvbihyb3csIGNvbHVtbk5hbWUsIHJvd0luZGV4KXtcblx0XHRcdFx0aWYodGhpcy5zdGF0ZS5kdW1teVJvd0luZGV4ID09PSByb3dJbmRleCl7XG5cdFx0XHRcdFx0aWYoY29sdW1uTmFtZSA9PT0gXCJhY3Rpb25zXCIpe1xuXHRcdFx0XHRcdFx0cmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoSW1hZ2VCdXR0b24sIHtjbGFzc05hbWU6IFwiZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzXCIsIG9uQ2xpY2s6IHRoaXMuaGFuZGxlQWRkQnV0dG9uQ2xpY2suYmluZCh0aGlzLCByb3csIHJvd0luZGV4KX0pXG5cdFx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0XHR2YXIgdXBkYXRlVmFsdWUgPSBmdW5jdGlvbihjb2x1bW5OYW1lLCB2YWwpe1xuXHRcdFx0XHRcdFx0XHR0aGlzLnN0YXRlLnJvd0FkZEJ1ZmZlcltjb2x1bW5OYW1lXSA9IHZhbDtcblx0XHRcdFx0XHRcdH0uYmluZCh0aGlzLCBjb2x1bW5OYW1lKTtcblx0XHRcdFx0XHRcdHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KEVkaXRhYmxlRmllbGQsIHtpbml0aWFsVmFsdWU6IFwiXCIsIG9uQ2hhbmdlOiB1cGRhdGVWYWx1ZSwgb25FZGl0OiB0aGlzLmhhbmRsZUFkZEJ1dHRvbkNsaWNrLmJpbmQodGhpcywgcm93LCByb3dJbmRleCl9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdHJldHVybiBfcmVuZGVyRmllbGQocm93LCBjb2x1bW5OYW1lLCByb3dJbmRleCk7XG5cdFx0XHRcdH1cblx0XHRcdH0uYmluZCh0aGlzKTtcblx0XHR9XG5cblx0XHR0aGlzLnN0YXRlLmFkZFJvd1JlZnMgPSB7fTtcblx0XHRyZXR1cm4gKFxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChSZWFkT25seVRhYmxlLCBSZWFjdC5fX3NwcmVhZCh7fSwgIG90aGVyLCBcblx0XHRcdFx0e2RhdGE6IHRoaXMuc3RhdGUuZGF0YSwgXG5cdFx0XHRcdGNvbHVtbnM6IGNvbHVtbnMsIFxuXHRcdFx0XHRleHRyYUNvbHVtbnM6IGV4dHJhQ29sdW1ucywgXG5cdFx0XHRcdHJlbmRlckNvbHVtbjogcmVuZGVyQ29sdW1uLCBcblx0XHRcdFx0cmVuZGVyRmllbGQ6IHJlbmRlckZpZWxkLCBcblxuXHRcdFx0XHRvblJvd0NsaWNrOiB0aGlzLmhhbmRsZVJvd0NsaWNrLCBcblx0XHRcdFx0cmVmOiBcImRhdGFUYWJsZVwifSksIFxuXG5cdFx0XHRcdCB0aGlzLnByb3BzLmNoaWxkcmVuXG5cdFx0XHQpXHRcblx0XHQpO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEYXRhVGFibGU7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcblxudmFyIFJlYWRPbmx5VGFibGUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6IFwiUmVhZE9ubHlUYWJsZVwiLFxuXHRwcm9wVHlwZXM6IHtcblx0XHRkYXRhOiBSZWFjdC5Qcm9wVHlwZXMuYXJyYXlPZihSZWFjdC5Qcm9wVHlwZXMub2JqZWN0KS5pc1JlcXVpcmVkLFxuXHRcdGNvbHVtbnM6IFJlYWN0LlByb3BUeXBlcy5hcnJheU9mKFJlYWN0LlByb3BUeXBlcy5zdHJpbmcpLFxuXHRcdHJlbmRlckZpZWxkOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcblx0XHRyZW5kZXJDb2x1bW46IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuXHRcdG9uUm93Q2xpY2s6IFJlYWN0LlByb3BUeXBlcy5mdW5jXG5cdH0sXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4ge1xuXHRcdFx0ZGF0YTogW10sXG5cdFx0XHRleHRyYUZpZWxkczogW10sXG5cdFx0XHRleHRyYUNvbHVtbnM6IFtdLFxuXHRcdFx0Y2xhc3NOYW1lOiBcInRhYmxlIHRhYmxlLXN0cmlwZWQgdGFibGUtY29uZGVuc2VkIHRhYmxlLWhvdmVyXCIsXG5cdFx0XHRyZW5kZXJGaWVsZDogZnVuY3Rpb24ocm93LCBjb2x1bW4sIHJvd0luZGV4KXtcblx0XHRcdFx0dmFyIHZhbCA9IG51bGw7XG5cdFx0XHRcdGlmKGNvbHVtbiBpbiByb3cpXG5cdFx0XHRcdFx0dmFsID0gcm93W2NvbHVtbl07XG5cdFx0XHRcdHJldHVybiB2YWw7XG5cdFx0XHR9LFxuXHRcdFx0cmVuZGVyQ29sdW1uOiBmdW5jdGlvbihjKXsgcmV0dXJuIGMgfVxuXHRcdH07XG5cdH0sXG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4ge307XG5cdH0sXG5cdGhhbmRsZVJvd0NsaWNrOiBmdW5jdGlvbihyb3csIHJvd0luZGV4KXtcblx0XHRpZih0aGlzLnByb3BzLm9uUm93Q2xpY2spXG5cdFx0XHR0aGlzLnByb3BzLm9uUm93Q2xpY2socm93LCByb3dJbmRleCk7XG5cdFx0dGhpcy5zdGF0ZS5sYXN0U2VsZWN0ZWRSb3cgPSByb3c7XG5cdFx0dGhpcy5zdGF0ZS5sYXN0U2VsZWN0ZWRSb3dJbmRleCA9IHJvd0luZGV4O1xuXHR9LFxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKXtcblx0XHQkKCBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMudGJvZHkpICkub24oXCJjbGlja1wiLCBcInRyXCIsIGZ1bmN0aW9uKGV2dCl7IFxuXHRcdFx0XHR2YXIgaSA9ICQoIGV2dC50YXJnZXQgKS5wYXJlbnRzVW50aWwoXCJ0Ym9keVwiLCBcInRyXCIpLmluZGV4KCk7XG5cdFx0XHRcdGlmKGkgPCB0aGlzLnByb3BzLmRhdGEubGVuZ3RoKVxuXHRcdFx0XHRcdHRoaXMuaGFuZGxlUm93Q2xpY2soIHRoaXMucHJvcHMuZGF0YVtpXSwgaSApO1xuXHRcdFx0fS5iaW5kKHRoaXMpXG5cdFx0KTtcblx0fSxcblx0bWFrZURhdGFSb3dzOiBmdW5jdGlvbihjb2x1bW5zKXtcblx0XHR2YXIgZGF0YSA9IHRoaXMucHJvcHMuZGF0YTtcblx0XHR2YXIgcmVuZGVyRmllbGQgPSB0aGlzLnByb3BzLnJlbmRlckZpZWxkLmJpbmQodGhpcyk7XG5cblx0XHRyZXR1cm4gZGF0YS5maWx0ZXIoXy5pc09iamVjdCkubWFwKGZ1bmN0aW9uKGl0ZW0sIHJvd0luZGV4KXtcblx0XHRcdHJldHVybiAoXG5cdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJ0clwiLCB7a2V5OiByb3dJbmRleH0sIFxuXHRcdFx0XHRcdCBcblx0XHRcdFx0XHRcdGNvbHVtbnMubWFwKGZ1bmN0aW9uKGMsaSl7IFxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChcInRkXCIsIHtrZXk6IGl9LCAgcmVuZGVyRmllbGQoaXRlbSwgYywgcm93SW5kZXgpIClcblx0XHRcdFx0XHRcdH0pLCBcblx0XHRcdFx0XHRcblxuXHRcdFx0XHRcdCB0aGlzLnByb3BzLmV4dHJhRmllbGRzLm1hcChmdW5jdGlvbih4LCBpKXsgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJ0ZFwiLCB7a2V5OiBpK2NvbHVtbnMubGVuZ3RofSwgeCkgfSkgXG5cdFx0XHRcdClcblx0XHRcdClcblx0XHR9LmJpbmQodGhpcykpOyBcblx0fSxcblx0bWFrZUNvbHVtbnM6IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIGNvbHVtbnM7XG5cdFx0aWYodGhpcy5wcm9wcy5jb2x1bW5zKXtcblx0XHRcdGNvbHVtbnMgPSB0aGlzLnByb3BzLmNvbHVtbnM7XG5cdFx0fWVsc2UgaWYodGhpcy5wcm9wcy5kYXRhLmxlbmd0aCA+IDApe1xuXHRcdFx0Y29sdW1ucyA9IE9iamVjdC5rZXlzKHRoaXMucHJvcHMuZGF0YVswXSk7XG5cdFx0fWVsc2V7XG5cdFx0XHRjb2x1bW5zID0gW107XG5cdFx0fVxuXG5cdFx0LyogTWVyZ2UgZXh0cmFDb2x1bW5zICovXG5cdFx0aWYodGhpcy5wcm9wcy5leHRyYUNvbHVtbnMpe1xuXHRcdFx0dmFyIF9jb2x1bW5zID0gXy5yYW5nZShfLmtleXModGhpcy5wcm9wcy5leHRyYUNvbHVtbnMpLmxlbmd0aCArIGNvbHVtbnMubGVuZ3RoKTtcblx0XHRcdF9jb2x1bW5zID0gXy5tYXAoX2NvbHVtbnMsIGZ1bmN0aW9uKGluZGV4KXsgcmV0dXJuIHRoaXNbaW5kZXhdIH0uYmluZCh0aGlzLnByb3BzLmV4dHJhQ29sdW1ucykgKTtcblxuXHRcdFx0dmFyIGluZGV4ID0gMDtcblx0XHRcdGZvcih2YXIgaT0wOyBpIDwgX2NvbHVtbnMubGVuZ3RoOyBpKyspXG5cdFx0XHRcdF9jb2x1bW5zW2ldID0gXy5pc1VuZGVmaW5lZChfY29sdW1uc1tpXSk/IGNvbHVtbnNbaW5kZXgrK10gOiBfY29sdW1uc1tpXTtcblx0XHRcdGNvbHVtbnMgPSBfY29sdW1ucztcblx0XHR9XG5cdFx0cmV0dXJuIGNvbHVtbnM7XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24oKXtcblx0XHR2YXIgY29sdW1ucyA9IHRoaXMubWFrZUNvbHVtbnMoKTtcblx0XHRyZXR1cm4gKFxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcInRhYmxlXCIsIHtjbGFzc05hbWU6IHRoaXMucHJvcHMuY2xhc3NOYW1lLCByZWY6IFwidGFibGVcIn0sIFxuXHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwidGhlYWRcIiwgbnVsbCwgXG5cdFx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcInRyXCIsIG51bGwsIFxuXHRcdFx0XHRcdFx0IFxuXHRcdFx0XHRcdFx0XHRjb2x1bW5zLm1hcChmdW5jdGlvbihjLCBpKXsgXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJ0aFwiLCB7a2V5OiBpfSwgIHRoaXMucHJvcHMucmVuZGVyQ29sdW1uKGMpICkgXG5cdFx0XHRcdFx0XHRcdH0uYmluZCh0aGlzKSkgXG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHQpXG5cdFx0XHRcdCksIFxuXHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwidGJvZHlcIiwge3JlZjogXCJ0Ym9keVwifSwgXG5cdFx0XHRcdFx0IHRoaXMubWFrZURhdGFSb3dzKGNvbHVtbnMpIFxuXHRcdFx0XHQpXG5cdFx0XHQpXG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhZE9ubHlUYWJsZTsiXX0=
