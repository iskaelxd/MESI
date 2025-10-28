


function Sidebar() {
    return (
        <nav className="d-none d-md-block bg-light sidebar position-fixed top-0 start-0 vh-100 overflow-auto" style={{ width: 260 }}>
            <div className="sidebar-sticky mt-4">
            <div className="text-center mb-4">
              <h4>MESAI</h4>
              <p>MES Artificial Inteligence</p>
              </div>
              <hr style={{color: "darkblue"}}/>

                <ul className="nav flex-column">
                    <li className="nav-item">
                        <a className="nav-link active" href="#">
                            Dashboard <span className="sr-only">(current)</span>
                        </a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#">
                            Orders
                        </a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#">
                            
                            Products
                        </a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#">
                            
                            Customers
                        </a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#">
                            
                            Reports
                        </a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#">
                            
                            Integrations
                        </a>
                    </li>

                    <li className="nav-item">
                        <a className="nav-link" href="#">
                            Current month
                        </a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#">
                            Last quarter
                        </a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#">
                            Social engagement
                        </a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#">
                            Year-end sale
                        </a>
                    </li>
                </ul>
            </div>
        </nav>
    );
}


export default Sidebar;