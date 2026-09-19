CREATE OR REPLACE FUNCTION silver.fn_atualiza_historico_livros()
RETURNS trigger 
SECURITY DEFINER -- Garante que a função rode com privilégios de administrador
SET search_path = public, silver -- Prática de segurança para functions definers
AS $$
DECLARE
    v_business_key text;
    v_row_hash text;
    v_pk_hash text;
    v_active_row_hash text;
BEGIN
    v_business_key := COALESCE(NEW.isbn, 'SEM_ISBN') || '_' || NEW.dono_id::text || '_' || NEW.id::text;

    v_row_hash := md5(COALESCE(NEW.tema_genero, '') || COALESCE(NEW.estado_conservacao, '') || COALESCE(NEW.status, ''));

    IF TG_OP = 'UPDATE' THEN
        SELECT row_hash INTO v_active_row_hash
        FROM silver.dim_livros_historico
        WHERE livro_id = NEW.id AND is_ativo = true;

        IF v_row_hash = v_active_row_hash THEN
            RETURN NEW;
        END IF;

        UPDATE silver.dim_livros_historico
        SET data_fim = now(), is_ativo = false
        WHERE livro_id = NEW.id AND is_ativo = true;
    END IF;

    v_pk_hash := md5(v_business_key || now()::text);

    INSERT INTO silver.dim_livros_historico (
        pk_hash, business_key, row_hash, livro_id, dono_id, isbn,
        tema_genero, estado_conservacao, status, data_inicio, is_ativo
    ) VALUES (
        v_pk_hash, v_business_key, v_row_hash, NEW.id, NEW.dono_id, NEW.isbn,
        NEW.tema_genero, NEW.estado_conservacao, NEW.status, now(), true
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;