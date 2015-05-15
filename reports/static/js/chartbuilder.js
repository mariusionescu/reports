callback = function() {

        (function (chartBuilder, $, undefined) {

            var _self = chartBuilder;
            charts = {};

            _self.init = function () {

                jQuery(".report-data").each(function (index, tag) {
                    var report_tag = jQuery(this);

                    if (!report_tag.data('id')) {
                        console.error("-- report_missing id --");
                        return
                    }

                    if (!report_tag.data('key')) {
                        console.error("-- report_missing API key --");
                        return
                    }

                    var _el = {
                        output: 'json',
                        start_date: report_tag.data('start_date'),
                        end_date: report_tag.data('end_date'),
                        aggregation: report_tag.data('aggregation') ? report_tag.data('aggregation') : null,
                        chart_type: report_tag.data('charttype'),
                        key: report_tag.data('key'),
                        name: report_tag.data('name'),
                        report_id: report_tag.data('id')
                    };

                    _self.addChart({
                        settings: _el,
                        dom_element: report_tag[0]
                    });
                });
            };

            function draw_google_chart(args) {
                var self = this;

                this.data = null;
                this.computed_data = [];
                this.computed_headers = [];

                this.ts_to_time = function (timestamp) {
                    var date = new Date(timestamp * 1000);
                    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return date.getUTCFullYear() + '-' + months[date.getUTCMonth()] + '-' + date.getUTCDate();
                };

                this.get_calendar_time = function (timestamp) {
                    var date = new Date(timestamp * 1000);
                    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return date.getUTCFullYear() + '-' + months[date.getUTCMonth()] + '-' + date.getUTCDate();
                };

                this.data_table = {
                    compute_data: function () {
                        if (self.data.length > 1) {
                            console.error(" -- the table must have only 1 set of data -- ");
                            return;
                        }

                        var _headers = [];
                        var _preheaders = [];
                        var _data = [];
                        for (var i in self.data[0]) {
                            var rows = self.data[0][i];

                            //some headers may be missing
                            for (var j = 0; j < rows.length; j++) {
                                for (var k in rows[j]) {
                                    if (_preheaders.indexOf(k) == -1) {
                                        if(typeof(rows[j][k]) == "string")
                                        {
                                            _preheaders.unshift(k);
                                            _headers.unshift({name: k, type: 'string'});
                                        }
                                        else
                                        {
                                            _preheaders.push(k);
                                            _headers.push({name: k, type: 'number'});
                                        }
                                    }
                                }
                            }
                            console.log( _headers )

                            for (var j = 0; j < rows.length; j++) {
                                _row = [];
                                for (var k in _headers) {
                                    if (rows[j][_headers[k].name]) {
                                        _row.push(rows[j][_headers[k].name])
                                    }
                                    else {
                                        _row.push(0)
                                    }
                                }
                                _data.push(_row)
                            }
                            self.computed_headers = _headers;
                            self.computed_data = _data;
                        }
                    },
                    draw: function () {
                        var _table = new google.visualization.DataTable();
                        for (var i = 0; i < self.computed_headers.length; i++) {
                            _table.addColumn(self.computed_headers[i].type, self.computed_headers[i].name);
                        }
                        //console.log( self.computed_headers)
                        //console.log( self.computed_data)
                        _table.addRows(self.computed_data);

                        var options = {
                            title: args.settings.name,
                            showRowNumber: true,
                            page: 'enable',
                            pageSize: 25
                        };

                        var table = new google.visualization.Table(args.dom_element);
                        table.draw(_table, options);
                    },
                    display: function () {
                        this.compute_data();
                        this.draw();
                    }
                };

                this.pie_chart = {
                    compute_data: function () {
                        if (self.data.length > 1) {
                            console.error(" -- the table must have only 1 set of data -- ");
                            return;
                        }

                        var _headers = [];
                        var _data = [];
                        for (var i in self.data[0]) {
                            rows = self.data[0][i];

                            for (var j = 0; j < rows.length; j++) {
                                _row = []
                                for (var k in rows[j]) {
                                    if (_headers.indexOf(k) == -1) {

                                        _headers.push(k);
                                    }

                                    if (isNaN(rows[j][k]) || k == "timestamp") {
                                        _row.unshift(rows[j][k])
                                    } else {
                                        _row.push(rows[j][k])
                                    }
                                }
                                _data.push(_row)
                            }

                            self.computed_headers = _headers;
                            self.computed_data = [_headers];

                            for (var i = 0; i < _data.length; i++) {
                                self.computed_data.push(_data[i]);
                            }
                        }
                    },
                    draw: function () {

                        var _table = new google.visualization.arrayToDataTable(
                            self.computed_data
                        );

                        var options = {
                            title: args.settings.name,
                        };

                        var chart = new google.visualization.PieChart(args.dom_element);

                        chart.draw(_table, options);
                    },
                    display: function () {
                        this.compute_data();
                        this.draw();
                    }
                };

                this.bar_chart = {
                    compute_data: function () {

                        var _headers = ['Time'],
                            _series = [];
                        for (var h in self.data) {
                            var _data = [];

                            for (var i in self.data[h]) {
                                rows = self.data[h][i];

                                //var _row = [self.ts_to_time(i)]
                                var _row = {};

                                _row[i] = []

                                for (var j = 0; j < rows.length; j++) {
                                    var _definer = {
                                        header: null,
                                        value: null,
                                    };
                                    for (var k in rows[j]) {
                                        if (
                                            isNaN(rows[j][k])
                                        ) {
                                            if (_headers.indexOf(rows[j][k]) == -1) {
                                                _headers.push(rows[j][k]);
                                            }
                                            _definer.header = rows[j][k]
                                        }
                                        else {
                                            _definer.value = rows[j][k]
                                        }
                                    }
                                    _row[i].push(_definer)
                                }
                                _data = _row;
                            }

                            self.computed_headers = _headers;

                            _series.push(_data);
                        }

                        self.computed_data = [_headers];
                        var create_bar_array = function (data, header) {
                            for (var i in data) {
                                var _row_data = [self.ts_to_time(i)];

                                for (var j = 1; j < _headers.length; j++) {
                                    var _not_found = true;
                                    for (var k = 0; k < data[i].length; k++) {

                                        if (_headers[j] == data[i][k].header) {
                                            _row_data.push(data[i][k].value)
                                            _not_found = false;
                                        }
                                    }

                                    if (_not_found) {
                                        _row_data.push(0)
                                    }
                                }

                                self.computed_data.push(_row_data)
                            }
                            ;
                        }

                        for (var j in _series) {
                            create_bar_array(_series[j]);
                        }

                        if (_headers.length <= 1) {
                            var _series = [];
                            for (var h in self.data) {
                                var _data = [];

                                for (var i in self.data[h]) {
                                    rows = self.data[h][i];

                                    //var _row = [self.ts_to_time(i)]
                                    var _row = {};

                                    _row[i] = []

                                    for (var j = 0; j < rows.length; j++) {
                                        var _definer = {
                                            header: null,
                                            value: null,
                                        };
                                        for (var k in rows[j]) {

                                            if (_headers.indexOf(k) == -1) {
                                                _headers.push(k);
                                            }
                                            _definer.header = k
                                            _definer.value = rows[j][k]
                                        }
                                        _row[i].push(_definer)
                                    }
                                    _data = _row;
                                }

                                self.computed_headers = _headers;

                                _series.push(_data);
                            }

                            self.computed_data = [_headers];
                            var create_bar_array = function (data, header) {
                                for (var i in data) {
                                    var _row_data = [self.ts_to_time(i)];

                                    for (var j = 1; j < _headers.length; j++) {
                                        var _not_found = true;
                                        for (var k = 0; k < data[i].length; k++) {

                                            if (_headers[j] == data[i][k].header) {
                                                _row_data.push(data[i][k].value)
                                                _not_found = false;
                                            }
                                        }

                                        if (_not_found) {
                                            _row_data.push(0)
                                        }
                                    }

                                    self.computed_data.push(_row_data)
                                }
                                ;
                            }

                            for (var j in _series) {
                                create_bar_array(_series[j]);
                            }
                        }
                    },
                    draw: function () {
                        var _table = new google.visualization.arrayToDataTable(self.computed_data);

                        var options = {
                            title: args.settings.name,
                            subtitle: 'Sales, Expenses, and Profit: 2014-2017',
                            orientation: 'horizontal', // Required for Material Bar Charts.
                            width: 800
                        };

                        if( self.chart )
                        {
                            self.chart.draw(_table, options);
                            return
                        }

                        self.chart_report_element = document.createElement("div");
                        //self.chart_report_element.setAttribute('class', 'report_chart')
                        args.dom_element.appendChild(self.chart_report_element );
                        self.chart = new google.visualization.BarChart(self.chart_report_element);

                        self.chart.draw(_table, options);
                    },
                    display: function () {
                        this.compute_data();
                        this.draw_datepicker();
                        this.draw();
                    },
                    draw_datepicker: function () {

                        if( self.datapicker_container )
                        {
                            self.start_datepicker_container.datepicker({
                                dateFormat: 'yy-M-dd'
                            }).datepicker( "setDate", self.ts_to_time(self.start_date) );

                            self.end_datepicker_container.datepicker({
                                dateFormat: 'yy-M-dd'
                            }).datepicker( "setDate", self.ts_to_time(self.end_date) );

                            return
                        }

                        self.datapicker_container = jQuery('<div/>', {
                            class: 'datapicker_container',
                            style: 'background:white;'
                        }).appendTo(args.dom_element);
                        jQuery('<label/>', {
                            text: 'Start date: '
                        }).appendTo(self.datapicker_container);

                        self.start_datepicker_container = jQuery('<input/>', {
                            type: 'text',
                        }).appendTo(self.datapicker_container);

                        self.start_datepicker_container.datepicker({
                            dateFormat: 'yy-M-dd'
                        }).datepicker( "setDate", self.ts_to_time(self.start_date) );

                        jQuery('<label/>', {
                            text: 'End date: '
                        }).appendTo(self.datapicker_container);

                        self.end_datepicker_container = jQuery('<input/>', {
                            type: 'text',
                        }).appendTo(self.datapicker_container);

                        self.end_datepicker_container.datepicker({
                            dateFormat: 'yy-M-dd'
                        }).datepicker( "setDate", self.ts_to_time(self.end_date) );
                        var filter_button = jQuery('<button/>', {
                            text: 'Filter'
                        }).appendTo(self.datapicker_container);

                        filter_button.click(function() {
                            args.settings.start_date = new Date(self.start_datepicker_container.datepicker({ dateFormat: 'yy-mm-dd' }).val() + ' 00:00:00 UTC').getTime()/1000,
                            args.settings.end_date = new Date(self.end_datepicker_container.datepicker({ dateFormat: 'yy-mm-dd' }).val() + ' 23:59:59 UTC').getTime()/1000
                            self.get_data()
                        })
                    }
                };

                this.line_chart = {
                    compute_data: function () {

                        var _headers = ['Time'],
                            _series = [];
                        for (var h in self.data) {
                            var _data = [];

                            for (var i in self.data[h]) {
                                rows = self.data[h][i];

                                //var _row = [self.ts_to_time(i)]
                                var _row = {};

                                _row[i] = []

                                for (var j = 0; j < rows.length; j++) {
                                    var _definer = {
                                        header: null,
                                        value: null,
                                    };
                                    for (var k in rows[j]) {
                                        if (
                                            isNaN(rows[j][k])
                                        ) {
                                            if (_headers.indexOf(rows[j][k]) == -1) {
                                                _headers.push(rows[j][k]);
                                            }
                                            _definer.header = rows[j][k]
                                        }
                                        else {
                                            _definer.value = rows[j][k]
                                        }
                                    }
                                    _row[i].push(_definer)
                                }
                                _data = _row;
                            }

                            self.computed_headers = _headers;

                            _series.push(_data);
                        }

                        self.computed_data = [_headers];
                        var create_bar_array = function (data, header) {
                            for (var i in data) {
                                var _row_data = [self.ts_to_time(i)];

                                for (var j = 1; j < _headers.length; j++) {
                                    var _not_found = true;
                                    for (var k = 0; k < data[i].length; k++) {

                                        if (_headers[j] == data[i][k].header) {
                                            _row_data.push(data[i][k].value)
                                            _not_found = false;
                                        }
                                    }

                                    if (_not_found) {
                                        _row_data.push(0)
                                    }
                                }

                                self.computed_data.push(_row_data)
                            }
                            ;
                        }

                        for (var j in _series) {
                            create_bar_array(_series[j]);
                        }

                        if (_headers.length <= 1) {
                            var _series = [];
                            for (var h in self.data) {
                                var _data = [];

                                for (var i in self.data[h]) {
                                    rows = self.data[h][i];

                                    //var _row = [self.ts_to_time(i)]
                                    var _row = {};

                                    _row[i] = []

                                    for (var j = 0; j < rows.length; j++) {
                                        var _definer = {
                                            header: null,
                                            value: null,
                                        };
                                        for (var k in rows[j]) {

                                            if (_headers.indexOf(k) == -1) {
                                                _headers.push(k);
                                            }
                                            _definer.header = k
                                            _definer.value = rows[j][k]
                                        }
                                        _row[i].push(_definer)
                                    }
                                    _data = _row;
                                }

                                self.computed_headers = _headers;

                                _series.push(_data);
                            }

                            self.computed_data = [_headers];
                            var create_bar_array = function (data, header) {
                                for (var i in data) {
                                    var _row_data = [self.ts_to_time(i)];

                                    for (var j = 1; j < _headers.length; j++) {
                                        var _not_found = true;
                                        for (var k = 0; k < data[i].length; k++) {

                                            if (_headers[j] == data[i][k].header) {
                                                _row_data.push(data[i][k].value)
                                                _not_found = false;
                                            }
                                        }

                                        if (_not_found) {
                                            _row_data.push(0)
                                        }
                                    }

                                    self.computed_data.push(_row_data)
                                }
                                ;
                            }

                            for (var j in _series) {
                                create_bar_array(_series[j]);
                            }
                        }
                    },
                    draw: function () {
                        var _table = new google.visualization.arrayToDataTable(
                            self.computed_data
                        );

                        var options = {
                            title: args.settings.name,
                            legend: {position: 'bottom'},
                            pointSize: 10,
                            width: 800
                        };


                        if( self.chart )
                        {
                            self.view = new google.visualization.DataView(_table);
                            self.chart.draw(_table, options);
                            return
                        }

                        self.view = new google.visualization.DataView(_table);

                        self.chart_report_element = document.createElement("div");
                        args.dom_element.appendChild(self.chart_report_element );

                        self.chart = new google.visualization.LineChart(self.chart_report_element);

                        //var chart = new google.visualization.LineChart(args.dom_element);

                        self.chart.draw(_table, options);
                    },
                    draw_datepicker: function () {

                        if( self.datapicker_container )
                        {
                            self.start_datepicker_container.datepicker({
                                dateFormat: 'yy-M-dd'
                            }).datepicker( "setDate", self.ts_to_time(self.start_date) );

                            self.end_datepicker_container.datepicker({
                                dateFormat: 'yy-M-dd'
                            }).datepicker( "setDate", self.ts_to_time(self.end_date) );

                            return
                        }

                        self.datapicker_container = jQuery('<div/>', {
                            class: 'datapicker_container',
                            style: 'background:white;'
                        }).appendTo(args.dom_element);
                        jQuery('<label/>', {
                            text: 'Start date: '
                        }).appendTo(self.datapicker_container);

                        self.start_datepicker_container = jQuery('<input/>', {
                            type: 'text',
                        }).appendTo(self.datapicker_container);

                        self.start_datepicker_container.datepicker({
                            dateFormat: 'yy-M-dd'
                        }).datepicker( "setDate", self.ts_to_time(self.start_date) );

                        jQuery('<label/>', {
                            text: 'End date: '
                        }).appendTo(self.datapicker_container);

                        self.end_datepicker_container = jQuery('<input/>', {
                            type: 'text',
                        }).appendTo(self.datapicker_container);

                        self.end_datepicker_container.datepicker({
                            dateFormat: 'yy-M-dd'
                        }).datepicker( "setDate", self.ts_to_time(self.end_date) );
                        var filter_button = jQuery('<button/>', {
                            text: 'Filter'
                        }).appendTo(self.datapicker_container);

                        filter_button.click(function() {
                            args.settings.start_date = new Date(self.start_datepicker_container.datepicker({ dateFormat: 'yy-mm-dd' }).val() + ' 00:00:00 UTC').getTime()/1000,
                            args.settings.end_date = new Date(self.end_datepicker_container.datepicker({ dateFormat: 'yy-mm-dd' }).val() + ' 23:59:59 UTC').getTime()/1000
                            self.get_data()
                        })
                    },
                    display: function () {
                        this.compute_data();
                        this.draw_datepicker();
                        this.draw();
                    }
                };

                this.get_data = function()
                {
                    jQuery.ajax({
                        //url: "http://192.168.100.4/api/v1/report/" + args.settings.report_id + "/",
                        url: "http://reports.appixio.com/api/v1/report/" + args.settings.report_id + "/",
                        data: JSON.stringify(args.settings),
                        type: "POST",
                        dataType: 'json'
                    })
                        .always(function (result) {
                            self.data = result.data;
                            self.start_date = result.start_date;
                            self.end_date = result.end_date;
                            self[args.settings.chart_type].display();
                        })
                }

                this.get_data()
            }

            _self.addChart = function (args) {
                charts[(args.settings.report_id + '_' + args.settings.key + '_' + args.settings.chart_type)] = new draw_google_chart(args);
            };

            $.getScript("https://www.google.com/jsapi").done(function () {
                google.load('visualization', '1', {packages: ['corechart', 'table'], callback: _self.init});
            });
        }(window.chartBuilder = window.chartBuilder || {}, jQuery));

    }

if(!window.jQuery)
{
    var script = document.createElement('script');
    script.type = "text/javascript";
    //script.src = "http://192.168.100.4/static/admin/js/jquery.js";
    script.src = "http://reports.appixio.com/static/admin/js/jquery.js";
    document.getElementsByTagName('head')[0].appendChild(script);
    script.onload =
        function(){
            link = document.createElement('link');
            //link.href = "http://192.168.100.4/static/css/jquery-ui.min.css";
            link.href = "http://reports.appixio.com/static/css/jquery-ui.min.css";
            link.type = "text/css";
            link.rel = "stylesheet";
            link.media = "screen,print";
            document.getElementsByTagName( "head" )[0].appendChild( link );

            link.onload = function()
            {
                var script = document.createElement('script');
                script.type = "text/javascript";
                //script.src = "http://192.168.100.4/static/js/jquery-ui.min.js";
                script.src = "http://reports.appixio.com/static/js/jquery-ui.min.js";
                document.getElementsByTagName('head')[0].appendChild(script);
                script.onload = callback;
            }
        }
}
else
{
    callback();
}