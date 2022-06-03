from app import app
import unittest
import HtmlTestRunner


class FlaskTest(unittest.TestCase):
    # Test that login page loads correctly
    def test_login_page_load(self):
        check = app.test_client(self)
        response = check.get('/login', content_type= 'html/text')
        self.assertEqual(response.status_code, 200)

    # Test to check redirecting to main page with correct username and password
    def test_login(self):
        check = app.test_client(self)
        response = check.post('/login', data=dict(username='admin', password='admin'), follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        assert response.request.path == "/"

    # Test to check that main page is not accessed if wrong username and password
    def test_wrong_pw(self):
        check = app.test_client(self)
        response = check.post('/login', data=dict(username='admin', password='1111'), follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        assert not response.request.path == "/"

    # Test that login page is rendered with message if wrong username or pw is given
    def test_wrong_pw_rendering_login_page(self):
        check = app.test_client(self)
        response = check.post('/login', data=dict(username='admin', password='1111'), follow_redirects=True)
        self.assertIn(b'Kirjautuminen ei onnistunut!', response.data)

    # Test logout
    def test_logout(self):
        check = app.test_client(self)
        check.post('/login', data=dict(username='admin', password='admin'), follow_redirects=True)
        response = check.get('/logout', follow_redirects=True)
        assert response.request.path == "/login"

if __name__== '__main__':
    unittest.main(testRunner=HtmlTestRunner.HTMLTestRunner(output='tests'))