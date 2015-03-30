(function( chartBuilder, $, undefined ) {

    var _self = chartBuilder;
        charts = {};

    _self.init = function() {

        jQuery(".report-data").each(function(index, tag){
            var report_tag = jQuery(this);

            if( !report_tag.data('id') )
            {
                console.error( "-- report_missing id --" );
                return
            }

            if( !report_tag.data('key') )
            {
                console.error( "-- report_missing API key --" );
                return
            }

            _el = {
                output: 'json',
                start_date: report_tag.data('start_date'),
                end_date: report_tag.data('end_date'),
                aggregation: report_tag.data('aggregation'),
                chart_type: report_tag.data('charttype'),
                key: report_tag.data('key'),
                report_id: report_tag.data('id')

            };

            _self.addChart({
                settings: _el,
                dom_element: report_tag[0]
            });
        });
    };

    function draw_google_chart(args)
    {
        var self = this;

        this.data = null;
        this.computed_data = [];
        this.computed_headers = [];

        this.data_table = {
            compute_data: function() {
                if( self.data.length > 1 )
                {
                    console.error(" -- the table must have only 1 set of data -- ")
                    return;
                }

                var _headers = [];
                var _data =[];
                for( var i in self.data[0])
                {
                    rows = self.data[0][i];

                    for( var j = 0; j < rows.length; j++ )
                    {
                        _row = []
                        for( var k in rows[j] )
                        {
                            if( _headers.indexOf( k ) == -1 )
                            {
                                _headers.push(k);
                            }

                            _row.push(rows[j][k].toString())
                        }
                        _data.push(_row)
                    }
                    self.computed_headers = _headers;
                    self.computed_data = _data;
                }
            },
            draw: function() {
                var _table = new google.visualization.DataTable();
                for( var i = 0; i < self.computed_headers.length; i++ )
                {
                    _table.addColumn('string', self.computed_headers[i]);
                }

                _table.addRows(self.computed_data);

                var table = new google.visualization.Table(args.dom_element);
                table.draw(_table, {showRowNumber: true});
            },
            display: function() {
                this.compute_data();
                this.draw();
            }
        };

        this.pie_chart = {
            compute_data: function() {
                if( self.data.length > 1 )
                {
                    console.error(" -- the table must have only 1 set of data -- ")
                    return;
                }

                var _headers = [];
                var _data =[];
                for( var i in self.data[0])
                {
                    rows = self.data[0][i];

                    for( var j = 0; j < rows.length; j++ )
                    {
                        _row = []
                        for( var k in rows[j] )
                        {
                            if( _headers.indexOf( k ) == -1 )
                            {

                                _headers.push(k);
                            }

                            if( isNaN(rows[j][k]) )
                            {
                                _row.unshift(rows[j][k])
                            } else
                            {
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
            draw: function() {

                var _table = new google.visualization.arrayToDataTable(
                    self.computed_data
                );
               /* for( var i = 0; i < self.computed_headers.length; i++ )
                {
                    _table.addColumn('string', self.computed_headers[i]);
                }

                _table.addRows(self.computed_data);*/


                var chart = new google.visualization.PieChart(args.dom_element);

                chart.draw(_table, {title:'sdfasasdf'});
            },
            display: function() {
                this.compute_data();
                this.draw();
            }
        };

        this.bar_chart = {
            compute_data: function() {

                var _headers = ['Time'];
                var _data = [];
                    //
                    for (var i in self.data[0]) {
                        rows = self.data[0][i];

                        var date = new Date(i*1000);
                        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                        var month = months[date.getMonth()];
                        i = date.getFullYear() + '-' + month + '-' + date.getDate();


                        var _row = [i]

                        for (var j = 0; j < rows.length; j++) {

                            for (var k in rows[j]) {

                                if (isNaN(rows[j][k])) {
                                     if (_headers.indexOf(k) == -1) {


                                            _headers.push(rows[j][k]);

                                    }

                                } else {
                                    _row.push(rows[j][k])
                                }
                            }
                        }
                        _data = _row;
                        self.computed_headers = _headers;
                        self.computed_data = [_headers];
                        self.computed_data.push(_data);
                    }
            },
            draw: function() {

                var _table = new google.visualization.arrayToDataTable(
                    self.computed_data
                );
               /* for( var i = 0; i < self.computed_headers.length; i++ )
                {
                    _table.addColumn('string', self.computed_headers[i]);
                }

                _table.addRows(self.computed_data);*/

                var chart = new google.visualization.BarChart(args.dom_element);

                chart.draw(_table, {title:'sdfasasdf'});
            },
            display: function() {
                this.compute_data();
                this.draw();
            }
        };


        jQuery.ajax({
                    url: "http://192.168.100.4/api/v1/report/" + args.settings.report_id + "/",
                    data: JSON.stringify(args.settings),
                    type: "POST",
                    dataType: 'json'
                })
                .done(function(result) {

                    self.data = result.data;

                    self[ args.settings.chart_type ].display();

            })

    }

    _self.addChart = function(args)
    {
        charts[(args.settings.report_id + '_' + args.settings.key + '_' + args.settings.chart_type)] = new draw_google_chart(args);
    };


    $.getScript("https://www.google.com/jsapi").done(function () {
       google.load('visualization', '1', {packages: ['corechart','table'], callback: _self.init});
    });
}( window.chartBuilder = window.chartBuilder || {}, jQuery ));