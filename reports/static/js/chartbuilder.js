(function( chartBuilder, $, undefined ) {

    var libraryLoaded = false,
        charts = [];

    var imported = document.createElement('script');
    imported.src = 'https://www.google.com/jsapi?autoload={"modules":[{"name":"visualization","version":"1","packages":["corechart","table"]}]}';
    document.head.appendChild(imported);
    imported.onload = function() {
        google.setOnLoadCallback(chartBuilder.onLibraryLoad);

        //Public Method
        chartBuilder.onLibraryLoaded = function () {
            libraryLoaded = true;
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
            charts.push(new chart(args))
        };

        //Private Method
        function chart(args) {
            var self = this;
            this.id = args.containerID;
            this.type = args.type;
            this.data = google.visualization.arrayToDataTable(addHeaders(args.data, args.headers));
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
                    console.log(charts.length)
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
        report_dom_element = document.querySelector('#report-data');
        report_data = JSON.parse( report_dom_element.getAttribute("report-data") );
        console.log( report_data );

        $.ajax({
            url: "http://reports/api/v1/report/" + report_data.id + "/?" + encodeURIComponent(JSON.stringify({
                output: 'json',
                //start_date: report_data.start_date,
                //end_date: report_data.end_date,
                aggregation: report_data.aggregation,
                key: report_data.key
            })),
            type: "POST",
            dataType: 'json'
        }).done(
        function(result)
        {
            _table = []
            _data = result.data;
            for( var i = 0; i < result.data.length; i++ )
            {
                _row = [];

                for (j in _data[ i ])
                {
                    console.log( _data[i][j], _row );

                    if( j == 'timestamp' )
                    {
                        var date = new Date(_data[i][j]*1000);

                        _data[i][j] = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()
                    }

                    if( j != 'timestamp' && typeof _data[i][j] != 'number')
                    {
                        continue
                    }

                    _row.push(_data[i][j])
                }
                _row[0] = _row.splice(1, 1, _row[0])[0];
                _table.push( _row )
            }

            console.log( _table )
            chartBuilder.addChart({
                type: 'bar_chart',
                data: _table,
                headers: ['1','2'],
                name: 'REPORT',
                tableSize: 10
            });
        }
    );

    }

}( window.chartBuilder = window.chartBuilder || {}, jQuery ));