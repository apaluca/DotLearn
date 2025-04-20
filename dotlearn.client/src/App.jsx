import { useEffect, useState } from "react";
import { Container, Table, Alert, Spinner, Card } from "react-bootstrap";
import "./App.css";
import NavBar from "./components/NavBar";

function App() {
  const [forecasts, setForecasts] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    populateWeatherData();
  }, []);

  async function populateWeatherData() {
    try {
      const response = await fetch("weatherforecast");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setForecasts(data);
    } catch (e) {
      setError(
        "Failed to fetch weather data. Please ensure the backend server is running.",
      );
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  let content;
  if (loading) {
    content = (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading weather data...</p>
      </div>
    );
  } else if (error) {
    content = <Alert variant="danger">{error}</Alert>;
  } else {
    content = (
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Date</th>
            <th>Temp. (C)</th>
            <th>Temp. (F)</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>
          {forecasts?.map((forecast) => (
            <tr key={forecast.date}>
              <td>{forecast.date}</td>
              <td>{forecast.temperatureC}</td>
              <td>{forecast.temperatureF}</td>
              <td>{forecast.summary}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  }

  return (
    <>
      <NavBar />
      <Container className="py-4">
        <Card className="shadow-sm">
          <Card.Body>
            <Card.Title as="h1" className="mb-4">
              Weather Forecast
            </Card.Title>
            <Card.Text>
              This component demonstrates fetching data from the ASP.NET Core
              backend.
            </Card.Text>
            {content}
          </Card.Body>
        </Card>
      </Container>
    </>
  );
}

export default App;
