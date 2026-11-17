// Точка входа: подключает маршруты и запускает приложение.

Theme.init();

// Обёртка для страниц, которые доступны только после входа
function protectedRoute(render) {
  return (params, query) => {
    if (!Auth.current()) {
      Router.go('/login');
      return;
    }
    render(params, query);
  };
}

Router.add('/login', () => {
  if (Auth.current()) Router.go('/home');
  else LoginPage.render();
});

Router.add('/home', protectedRoute(() => DashboardPage.render()));
Router.add('/courses', protectedRoute(() => CoursesPage.render()));
Router.add('/course/:id', protectedRoute(params => CoursePage.render(params)));
Router.add('/task/:id', protectedRoute(params => TaskPage.render(params)));
Router.add('/grades', protectedRoute((params, query) => GradesPage.render(query)));
Router.add('/calendar', protectedRoute(() => CalendarPage.render()));
Router.add('/review', protectedRoute((params, query) => ReviewPage.render(query)));
Router.add('/profile', protectedRoute(() => ProfilePage.render()));

Router.start();
