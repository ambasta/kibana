import html from 'ui/timepicker/timepicker.html';
import _ from 'lodash';
import dateMath from '@elastic/datemath';
import moment from 'moment';
import Notifier from 'ui/notify/notifier';
import 'ui/directives/input_datetime';
import 'ui/directives/inequality';
import 'ui/timepicker/quick_ranges';
import 'ui/timepicker/refresh_intervals';
import 'ui/timepicker/time_units';
import 'ui/timepicker/kbn_global_timepicker';
import uiModules from 'ui/modules';
let module = uiModules.get('ui/timepicker');
let notify = new Notifier({
  location: 'timepicker',
});

module.directive('kbnTimepicker', function (quickRanges, timeUnits, refreshIntervals) {
  return {
    restrict: 'E',
    scope: {
      from: '=',
      to: '=',
      mode: '=',
      interval: '=',
      activeTab: '='
    },
    template: html,
    controller: function ($scope) {
      $scope.format = 'MMMM Do YYYY, HH:mm:ss.SSS';
      $scope.modes = ['quick', 'relative', 'absolute'];
      $scope.activeTab = $scope.activeTab || 'filter';

      if (_.isUndefined($scope.mode)) $scope.mode = 'quick';

      $scope.quickLists = _(quickRanges).groupBy('section').values().value();
      $scope.refreshLists = _(refreshIntervals).groupBy('section').values().value();

      $scope.relative = {
        from: {
          count: 1,
          unit: 'm',
          preview: undefined,
          round: false
        },
        to: {
          count: 1,
          unit: 'm',
          preview: undefined,
          round: false
        }
      };

      $scope.absolute = {
        from: moment(),
        to: moment()
      };

      $scope.units = timeUnits;

      $scope.relativeOptions = {
        from: [
          {text: 'Seconds ago', value: 's'},
          {text: 'Minutes ago', value: 'm'},
          {text: 'Hours ago', value: 'h'},
          {text: 'Days ago', value: 'd'},
          {text: 'Weeks ago', value: 'w'},
          {text: 'Months ago', value: 'M'},
          {text: 'Years ago', value: 'y'}
        ],
        to: [
          {text: 'Seconds later', value: 's'},
          {text: 'Minutes later', value: 'm'},
          {text: 'Hours later', value: 'h'},
          {text: 'Days later', value: 'd'},
          {text: 'Weeks later', value: 'w'},
          {text: 'Months later', value: 'M'},
          {text: 'Years later', value: 'y'}
        ]
      };

      $scope.$watch('absolute.from', function (date) {
        if (_.isDate(date)) $scope.absolute.from = moment(date);
      });

      $scope.$watch('absolute.to', function (date) {
        if (_.isDate(date)) $scope.absolute.to = moment(date);
      });

      $scope.setMode = function (thisMode) {
        switch (thisMode) {
          case 'quick':
            break;
          case 'relative':
            var durationTo = moment.duration(moment().diff(dateMath.parse($scope.to)));
            var durationFrom = moment.duration(moment().diff(dateMath.parse($scope.from)));

            var unitsTo = _.pluck(_.clone($scope.relativeOptions.to).reverse(), 'value');
            var unitsFrom = _.pluck(_.clone($scope.relativeOptions.from).reverse(), 'value');

            if ($scope.from.toString().split('/')[1]) $scope.relative.from.round = true;
            if ($scope.to.toString().split('/')[1]) $scope.relative.to.round = true;

            function setAs(unit, duration, scope) {
              var as = duration.as(unit);

              if (as > 1) {
                scope.count = Math.round(as);
                scope.unit = unit;
                return true;
              }
              return false;
            }

            unitsTo.some(function (unit) {return setAs(unit, durationTo, $scope.relative.to);});
            unitsFrom.some(function (unit) {return setAs(unit, durationFrom, $scope.relative.from);});

            if ($scope.from.toString().split('/')[1]) $scope.relative.from.round = true;
            if ($scope.to.toString().split('/')[1]) $scope.relative.to.round = true;

            $scope.formatRelative('from');
            $scope.formatRelative('to');

            break;
          case 'absolute':
            $scope.absolute.from = dateMath.parse($scope.from || moment().subtract(15, 'minutes'));
            $scope.absolute.to = dateMath.parse($scope.to || moment(), true);
            break;
        }

        $scope.mode = thisMode;
      };

      $scope.setQuick = function (from, to) {
        $scope.from = from;
        $scope.to = to;
      };

      $scope.setToNow = function () {
        $scope.absolute.to = moment();
      };

      $scope.formatRelative = function (reference) {
        var parsed = dateMath.parse(getRelativeString(reference));
        $scope.relative[reference].preview = parsed ? parsed.format($scope.format) : undefined;
        return parsed;
      };

      $scope.applyRelative = function () {
        $scope.from = getRelativeString('from');
        $scope.to = getRelativeString('to');
      };

      function getRelativeString(reference) {
        var modifier = '+';

        if (reference === 'from') {
          modifier = '-';
        }

        return 'now' + modifier + $scope.relative[reference].count + $scope.relative[reference].unit + (
            $scope.relative[reference].round ? '/' + $scope.relative[reference].unit : '');
      }

      $scope.applyAbsolute = function () {
        $scope.from = moment($scope.absolute.from);
        $scope.to = moment($scope.absolute.to);
      };

      $scope.setRefreshInterval = function (interval) {
        interval = _.clone(interval || {});
        notify.log('before: ' + interval.pause);
        interval.pause = (interval.pause == null || interval.pause === false) ? false : true;

        notify.log('after: ' + interval.pause);

        $scope.interval = interval;
      };

      $scope.setMode($scope.mode);
    }
  };
});
