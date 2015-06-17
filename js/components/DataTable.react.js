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

var Checkbox = React.createClass({
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
			<input type="checkbox" 
					checked={this.state.isChecked} 
					onChange={this.onChange} />
		);
	}
});

var EditableField = React.createClass({
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
			<input type="text" value={this.state.value} onKeyDown={this.handleKeyDown} onChange={this.handleChange} />
		)
	}
});

var ImageButton = React.createClass({
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
			<a href="javascript: void(0)" style={style} onClick={this.props.onClick}><span className={klass} ref="placeholder" disabled={this.state.enabled}></span></a>
		);
	}
});


var DataTable = React.createClass({
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
		var { columns, extraColumns, renderColumn, renderField, ...other } = this.props;
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
			batchActions.push(<button onClick={batchDelete}>delete selected</button>);
		}

		var renderColumn = function(columnName){
			if(columnName === "actions"){
				if(batchActions.length > 0 )
					return  (
						<div>
							<Checkbox checked={this.state.selectAllChecked} onChange={this.toggleSelectAll} ref="selectAll" />
							{ 
								batchActions.map(function(element){ 
									if(element.props.onClick){
										var _onClick = function(){
											return element.props.onClick(this.selectedRows());
										}.bind(this);
										return React.cloneElement(element, {onClick: _onClick});
									}
									return element;
								}.bind(this) ) 
							}
						</div>
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
				buttons.push(<ImageButton className="glyphicon glyphicon-pencil" onClick={this.handleEditButtonClick} />);
			if(this.props.canDelete)
				buttons.push(<ImageButton className="glyphicon glyphicon-trash" onClick={this.handleDeleteButtonClick} />);
			return (
				<div>
					{ buttons }
					{ this.props.extraRowActions }
				</div>
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
				return <EditableField initialValue={row[columnName]} onEdit={callHandleFieldEdit.bind(this,row,rowIndex)} />
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
						return <ImageButton className="glyphicon glyphicon-plus" onClick={this.handleAddButtonClick.bind(this, row, rowIndex)} />
					}else{
						var updateValue = function(columnName, val){
							this.state.rowAddBuffer[columnName] = val;
						}.bind(this, columnName);
						return <EditableField initialValue={""} onChange={updateValue} onEdit={this.handleAddButtonClick.bind(this, row, rowIndex)} />;
					}
				}else{
					return _renderField(row, columnName, rowIndex);
				}
			}.bind(this);
		}

		this.state.addRowRefs = {};
		return (
			<ReadOnlyTable {...other}
				data={this.state.data} 
				columns={columns} 
				extraColumns={extraColumns}
				renderColumn={renderColumn} 
				renderField={renderField}

				onRowClick={this.handleRowClick} 
				ref="dataTable" >

				{ this.props.children }
			</ReadOnlyTable>	
		);
	}
});

module.exports = DataTable;