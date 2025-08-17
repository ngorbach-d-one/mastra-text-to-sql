customers (
      customer_id BIGINT,
      email TEXT,
      full_name TEXT,
      created_at TIMESTAMP WITH TIME ZONE
    );
    employees (
      employee_id BIGINT,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      hire_date TIMESTAMP WITH TIME ZONE,
      salary NUMERIC
    );
    order_items (
      order_id BIGINT,
      product_id BIGINT,
      qty INTEGER,
      unit_price NUMERIC
    );
    orders (
      order_id BIGINT,
      customer_id BIGINT,
      order_date TIMESTAMP WITH TIME ZONE,
      status TEXT
    );
    products (
      product_id BIGINT,
      name TEXT,
      price NUMERIC,
      created_at TIMESTAMP WITH TIME ZONE
    );
