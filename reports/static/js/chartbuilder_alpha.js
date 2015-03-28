(function( chartBuilder, $, undefined ) {

    var libraryLoaded = false,
        charts = [];

    var imported = document.createElement('script');
    imported.src = 'https://www.google.com/jsapi';
    document.head.appendChild(imported);
    imported.onload = function() {
        console.log(11)
        // ?autoload={"modules":[{"name":"visualization","version":"1","packages":["corechart","table"]}]}
        google.load('visualization', '1.0', {'packages':["corechart","table"]});

        google.setOnLoadCallback(function(){

            libraryLoaded = true;
            chartBuilder.addChart = function (args) {
                charts.push(new chart(args))
            };
        });

        //Public Method
        chartBuilder.onLibraryLoaded = function () {
            libraryLoaded = true;

            google.load('visualization', '1.0', {'packages':['corechart']});
            console.log( 1)
        };

        chartBuilder.export = function (reportID) {
            for (var i = 0; i < charts.length; i++) {
                if (charts[i].id == 'table_' + reportID) {
                    charts[i].download()
                }
            }
        };

        //Public Method
        chartBuilder.addChart = function (args) {

            console.log( 'NL')
            return
        };

        //Private Method
        function chart(args) {

            console.log( libraryLoaded, "STATUS")

            var self = this;
            this.id = args.containerID;
            this.type = args.type;
            var _data = addHeaders(args.data, args.headers)
            console.log(_data)
            this.data = google.visualization.arrayToDataTable(_data);
            this.container = document.getElementById('report-data');

            switch (this.type) {
                case 'bar_chart':

                    var bar_chart = new google.visualization.BarChart(this.container);
                    var options = {
                        title: args.name,
                        vAxis: {
                            title: 'Year',
                            titleTextStyle: {color: 'red'}
                        }
                    };
                    bar_chart.draw(this.data, options);
                    break;

                case 'line_chart':

                    var options = {
                        title: args.name,
                        curveType: 'function',
                        legend: {
                            position: 'bottom'
                        }
                    };
                    var line_chart = new google.visualization.LineChart(this.container);
                    line_chart.draw(this.data, options);
                    break;

                case 'table':
                    var table = new google.visualization.Table(this.container);
                    var options = {
                        title: args.name,
                        showRowNumber: true,
                        page: 'enable',
                        pageSize: args.tableSize
                    };
                    table.draw(this.data, options);
                    break;

                case 'pie_chart':

                    var pie_chart = new google.visualization.PieChart(this.container);
                    var options = {
                        title: args.name
                    };
                    pie_chart.draw(this.data, options);
                    break;
            }

            this.download = function () {
                var link = document.createElement("a");
                link.setAttribute("href", "data:text/csv;charset=utf-8," + escape(convertJSONtoCSV()));
                link.setAttribute("download", "Report_" + self.id);

                link.click();
            };


            function convertJSONtoCSV() {
                var array = typeof args.data != 'object' ? JSON.parse(args.data) : args.data,
                    str = '';

                for (var i = 0; i < array.length; i++) {
                    var line = '';
                    for (var index in array[i]) {
                        line += array[i][index] + ',';
                    }
                    // Here is an example where you would wrap the values in double quotes
                    /*for (var index in array[i]) {
                     line += '"' + array[i][index] + '",';
                     }*/
                    line.slice(0, line.Length - 1);
                    str += line + '\r\n';
                }
                return str
            }
        }

        function addHeaders(data, headers) {
            var _computedData = [headers];

            for (var i = 0; i < data.length; i++) {
                _computedData.push(data[i]);
            }

            return _computedData;
        }
    };

    /*
        <div report-data='{"id":1, "aggregation":{"count": "sum"}, "key":"ASDASD23A"}'>
    */

    window.onload = function()
    {
        report_dom_element = document.querySelector('.report-data');
        var jEL = report_dom_element.getAttribute("report-data");
        console.log( jEL );
        report_data = JSON.parse( jEL );
        console.log( report_data )

        _el = JSON.stringify({
                output: 'json',
                //start_date: report_data.start_date,
                //end_date: report_data.end_date,
                aggregation: report_data.aggregation,
                key: report_data.key
            })

        $.ajax({
            url: "http://192.168.100.4/api/v1/report/" + report_data.id + "/",
            data: _el,
            type: "POST",
            dataType: 'json'
        }).done(
        function(result)
        {
            console.log( result );
            _table = []
            _data = result.data;
            _headers = [];
            console.log(result.data);
            for( var i = 0; i < result.data.length; i++ )
            {
                _row = [];

                for (j in _data[ i ])
                {
                    var _rowExists = false;
                    for( var k = 0; k < _headers.length; k++ )
                    {
                        if( _headers[k] == j )
                        {
                            _rowExists = true
                        }
                    }
                    if( !_rowExists )
                    {
                        _headers.push( j )
                    }

                    if( j == 'timestamp' )
                    {
                        var date = new Date(_data[i][j]*1000);
                        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                        var month = months[date.getMonth()];
                        _data[i][j] = date.getFullYear() + '-' + month + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()
                    }

                    _row.push(_data[i][j])
                }
               // _row[0] = _row.splice(1, 1, _row[0])[0];
                _table.push( _row )
            }
            console.log( _headers )

                    chartBuilder.addChart({
                        type: 'table',
                        data: _table,
                        headers: _headers,
                        name: 'REPORT',
                        tableSize: 10
                        });
                    clearInterval(_load )


        }
    );

    }

}( window.chartBuilder = window.chartBuilder || {}, jQuery ));