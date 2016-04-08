var index = require('../app/index');

describe('Tacos ', function () {

    beforeAll(function () {
        var jsonServer = require('json-server');
        var server = jsonServer.create();
        server.use(jsonServer.defaults());
        var router = jsonServer.router('specdb.json');
        server.use('/httpAuth/app/rest/', router);
        server.listen(8888)
    });

    beforeEach(function () {
        console.log('BEFORE EACH');
        //
    });

    describe('request method', function () {
        it('should call the REST api defined in request object', function () {
            execute(1, 2);
            var callback = function (result) {
            };
            var request = new Request('GET', 'test');
            spyOn(callback);
            execute(request, callback());
            expect(callback).toHaveBeenCalled();
        });
    });

});