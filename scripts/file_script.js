let selectedId = null;

    function selectKingdom(element) {
        document.querySelectorAll('#kingdom-list li').forEach(li => {
            li.classList.remove('selected');
        });
        element.classList.add('selected');
        selectedId = element.getAttribute('data-id');
    }

    function uploadSelected() {
        if (selectedId) {
            window.location.href = `/kingdom?kingdom_id=${selectedId}`;
        } else {
            alert('Пожалуйста, выберите королевство из списка.');
        }
    }

    async function deleteSelected() {
        if (!selectedId) {
            alert('Пожалуйста, выберите королевство для удаления.');
            return;
        }
        if (!confirm('Вы уверены, что хотите удалить это королевство? Данные будут потеряны навсегда.')) {
            return;
        }
        try {
            const response = await fetch(`/kingdom/${selectedId}`, { method: 'DELETE' });
            if (response.ok) {
                // Удаляем элемент из списка
                const li = document.querySelector(`#kingdom-list li[data-id="${selectedId}"]`);
                if (li) li.remove();
                selectedId = null;
                // Если список стал пустым, показываем сообщение
                if (document.querySelectorAll('#kingdom-list li').length === 0) {
                    document.querySelector('.workspace').innerHTML = '<p>Нет королевств</p>';
                }
            } else {
                const error = await response.json();
                alert(`Ошибка: ${error.detail || 'Не удалось удалить королевство'}`);
            }
        } catch (err) {
            alert('Ошибка соединения с сервером');
        }
    }

    function createKingdom() {
        window.location.href = '/kingdom';
    }
